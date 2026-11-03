-- Run supabase-social-wardrobe.sql FIRST, then this file. Safe to rerun.
-- Server-only RPC: API MUST derive p_actor from its signed session cookie.
-- Never expose service-role key to browsers.
begin;
-- Server-side key is required. Protect legacy account credentials from browser reads.
revoke all on public.users from public, anon, authenticated;
grant all on public.users to service_role;
create or replace function public.game_social(p_actor text,p_action text,p_data jsonb default '{}')
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 target text; fid uuid; cid uuid; row_friend public.friendships; row_invite public.clan_invites;
 member public.clan_members; clan public.clans; result jsonb;
begin
 -- Serialize social writes (including read-modify-write invitation flows).
 -- Separate from battle updates. Can be replaced with per-pair locks at larger scale.
 if p_action <> 'list' then perform pg_advisory_xact_lock(746281); end if;
 if not exists(select 1 from public.users where id=p_actor) then raise exception 'Account not found'; end if;
 select * into member from public.clan_members where user_id=p_actor;
 if p_action in ('request_friend','invite_clan') then
   select id into target from public.users where lower(username)=lower(trim(p_data->>'name')) or id=trim(p_data->>'name') limit 1;
   if target is null then raise exception 'Không tìm thấy người chơi / Player not found'; end if;
   if target=p_actor then raise exception 'Không thể tự gửi lời mời'; end if;
   if exists(select 1 from public.player_blocks where (blocker_id=p_actor and blocked_id=target) or (blocker_id=target and blocked_id=p_actor)) then raise exception 'Không thể gửi lời mời'; end if;
 end if;
 if p_action='request_friend' then
   if exists(select 1 from public.account_settings where user_id=target and not allow_friend_requests) then raise exception 'Người chơi không nhận lời mời'; end if;
   select * into row_friend from public.friendships where least(requester_id,recipient_id)=least(p_actor,target) and greatest(requester_id,recipient_id)=greatest(p_actor,target);
   if found and row_friend.status in ('pending','accepted') then raise exception 'Đã kết bạn hoặc đã có lời mời'; end if;
   if row_friend.id is null then
     insert into public.friendships(requester_id,recipient_id) values(p_actor,target);
   else
     update public.friendships set requester_id=p_actor,recipient_id=target,status='pending',updated_at=now() where id=row_friend.id;
   end if;
 elsif p_action in ('accept_friend','decline_friend','remove_friend','cancel_friend') then
   fid := (p_data->>'id')::uuid;
   select * into row_friend from public.friendships where id=fid for update;
   if not found then raise exception 'Lời mời không còn tồn tại'; end if;
   if p_action in ('accept_friend','decline_friend') then
     if row_friend.recipient_id<>p_actor or row_friend.status<>'pending' then raise exception 'Không có quyền xử lý lời mời'; end if;
     update public.friendships set status=case when p_action='accept_friend' then 'accepted' else 'declined' end,updated_at=now() where id=fid;
   else
     if p_actor not in (row_friend.requester_id,row_friend.recipient_id) then raise exception 'Forbidden'; end if;
     if p_action='cancel_friend' and (row_friend.requester_id<>p_actor or row_friend.status<>'pending') then raise exception 'Forbidden'; end if;
     if p_action='remove_friend' and row_friend.status<>'accepted' then raise exception 'Not friends'; end if;
     delete from public.friendships where id=fid;
   end if;
 elsif p_action='create_clan' then
   cid := public.create_game_clan(p_actor,p_data->>'name',p_data->>'tag',coalesce(p_data->>'description',''));
 elsif p_action='invite_clan' then
   if member.user_id is null or member.role not in ('leader','officer') then raise exception 'Chỉ trưởng/phó clan được mời'; end if;
   if exists(select 1 from public.clan_members where user_id=target) then raise exception 'Người chơi đã có clan'; end if;
   update public.clan_invites set status='cancelled' where clan_id=member.clan_id and invitee_id=target and status='pending' and expires_at<=now();
   if exists(select 1 from public.clan_invites where clan_id=member.clan_id and invitee_id=target and status='pending') then raise exception 'Đã gửi lời mời'; end if;
   insert into public.clan_invites(clan_id,inviter_id,invitee_id) values(member.clan_id,p_actor,target);
 elsif p_action in ('accept_clan','decline_clan') then
   select * into row_invite from public.clan_invites where id=(p_data->>'id')::uuid for update;
   if not found or row_invite.invitee_id<>p_actor or row_invite.status<>'pending' or row_invite.expires_at<=now() then raise exception 'Lời mời không hợp lệ hoặc đã hết hạn'; end if;
   if p_action='accept_clan' then
     if member.user_id is not null then raise exception 'Bạn đã có clan'; end if;
     insert into public.clan_members(clan_id,user_id) values(row_invite.clan_id,p_actor);
     update public.clan_invites set status='cancelled' where invitee_id=p_actor and status='pending' and id<>row_invite.id;
   end if;
   update public.clan_invites set status=case when p_action='accept_clan' then 'accepted' else 'declined' end where id=row_invite.id;
 elsif p_action='leave_clan' then
   if member.user_id is null then raise exception 'Bạn chưa có clan'; end if;
   select * into clan from public.clans where id=member.clan_id for update;
   if clan.owner_id=p_actor then
     select user_id into target from public.clan_members where clan_id=member.clan_id and user_id<>p_actor order by case role when 'officer' then 0 else 1 end,joined_at,user_id limit 1;
     if target is null then delete from public.clans where id=member.clan_id;
     else
       delete from public.clan_members where user_id=p_actor;
       update public.clan_members set role='leader' where user_id=target;
       update public.clans set owner_id=target where id=member.clan_id;
     end if;
   else delete from public.clan_members where user_id=p_actor;
   end if;
 elsif p_action <> 'list' then raise exception 'Unknown action';
 end if;
 select jsonb_build_object(
 'actorId',p_actor,
 'friends',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'name',u.username,'userId',u.id)) from public.friendships f join public.users u on u.id=case when f.requester_id=p_actor then f.recipient_id else f.requester_id end where p_actor in(f.requester_id,f.recipient_id) and f.status='accepted'),'[]'::jsonb),
 'incoming',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'name',u.username)) from public.friendships f join public.users u on u.id=f.requester_id where f.recipient_id=p_actor and f.status='pending'),'[]'::jsonb),
 'outgoing',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'name',u.username)) from public.friendships f join public.users u on u.id=f.recipient_id where f.requester_id=p_actor and f.status='pending'),'[]'::jsonb),
 'clan', (select jsonb_build_object('id',c.id,'name',c.name,'tag',c.tag,'description',c.description,'ownerId',c.owner_id,'role',m.role,'members',(select jsonb_agg(jsonb_build_object('id',u.id,'name',u.username,'role',cm.role)) from public.clan_members cm join public.users u on u.id=cm.user_id where cm.clan_id=c.id)) from public.clan_members m join public.clans c on c.id=m.clan_id where m.user_id=p_actor),
 'clanInvites',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'name',c.name,'tag',c.tag)) from public.clan_invites i join public.clans c on c.id=i.clan_id where i.invitee_id=p_actor and i.status='pending' and i.expires_at>now()),'[]'::jsonb)
 ) into result;
 return result;
end $$;
revoke all on function public.game_social(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.game_social(text,text,jsonb) to service_role;
commit;
