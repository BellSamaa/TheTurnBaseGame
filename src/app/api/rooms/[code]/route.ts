import { createLms, lmsAction } from '@/lib/lms';
import { sessionUser } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import {
  getRoomByCodeAsync,
  updateRoom,
  deleteRoom,
  getUserByIdAsync,
  saveUserAsync,
  calculateTier,
  type RoomParticipant,
} from '@/lib/serverDb';
import { CLASS_DEFINITIONS, WEAPON_DEFINITIONS } from '@/lib/constants';
import type { BattleState, PlayerState } from '@/types/game';

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const room = await getRoomByCodeAsync(code);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Phòng không tồn tại hoặc đã hết hạn (Room not found)' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, room });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const room = await getRoomByCodeAsync(code);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Phòng không tồn tại (Room not found)' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'heartbeat') {
      if (body.userId !== room.host.id) return NextResponse.json({ success: false }, { status: 403 });
      await updateRoom(room);
      return NextResponse.json({ success: true });
    }
    if (action === 'return_lobby') {
      if (!(room.participants || [room.host, ...(room.guest ? [room.guest] : [])]).some(p=>p.id===body.userId)) return NextResponse.json({ success: false }, { status: 403 });
      if (room.status === 'playing' && !room.battleState?.winnerId) return NextResponse.json({ success: false, error: 'Match still in progress' }, { status: 409 });
      if (room.status === 'finished' || room.status === 'playing') {
        room.status = room.guest ? 'ready' : 'waiting';
        room.host.isReady = false;
        room.participants = room.participants?.map(p=>({...p,isReady:false}));
        if (room.guest) room.guest.isReady = false;
        await updateRoom(room);
      }
      return NextResponse.json({ success: true, room });
    }

    // 1. JOIN ROOM
    if (action === 'join') {
      const { guest } = body;
      if (!guest || !guest.id) {
        return NextResponse.json({ success: false, error: 'Guest info required' }, { status: 400 });
      }

      if (room.host.id === guest.id) {
        // Host rejoining
        return NextResponse.json({ success: true, room });
      }

      if (room.guest?.id === guest.id) return NextResponse.json({ success: true, room });
      const lobbyParticipants = room.participants || [room.host, ...(room.guest ? [room.guest] : [])];
      const maxPlayers = room.maxPlayers || (room.gameMode === 'last_man_standing' ? 4 : 2);
      if (lobbyParticipants.length >= maxPlayers || room.status === 'playing' || room.status === 'finished') {
        return NextResponse.json(
          { success: false, error: `Phòng đã đủ ${maxPlayers} người chơi (Room is full)` },
          { status: 403 }
        );
      }

      const guestParticipant: RoomParticipant = {
        id: guest.id,
        name: guest.name,
        character: guest.character,
        classType: guest.classType || 'warrior',
        weaponId: guest.weaponId || 'greatsword',
        isReady: false,
      };

      room.guest = room.guest || guestParticipant;
      room.participants = [...lobbyParticipants, guestParticipant];
      room.status = 'ready';
      await updateRoom(room);
      return NextResponse.json({ success: true, room });
    }

    if (action === 'lms_action') {
      const actor = await sessionUser();
      if (!actor || !room.battleState?.lms || room.status !== 'playing') return NextResponse.json({error:'Không có trận LMS'}, {status:403});
      if (body.expectedRevision !== room.battleState.lms.revision) return NextResponse.json({room,error:'Trạng thái đã thay đổi, thử lại'}, {status:409});
      room.battleState.lms = lmsAction(room.battleState.lms, actor, body.move, body.args);
      if (room.battleState.lms.winner) { room.battleState.winnerId=room.battleState.lms.winner; room.status='finished'; }
      await updateRoom(room);
      return NextResponse.json({success:true,room});
    }
    // 2. TOGGLE READY STATUS
    if (action === 'ready') {
      const { userId, isReady } = body;
      if (room.status === 'playing' || room.status === 'finished') return NextResponse.json({ success: false, error: 'Battle already started' }, { status: 409 });
      if (room.host.id === userId) {
        room.host.isReady = isReady;
      } else if (room.guest && room.guest.id === userId) {
        room.guest.isReady = isReady;
      }
      if (room.participants) {
        room.participants = room.participants.map((p) => (p.id === userId ? { ...p, isReady } : p));
      }
      await updateRoom(room);
      return NextResponse.json({ success: true, room });
    }

    // 3. START BATTLE (When all required players ready)
    if (action === 'start_battle') {
      if (typeof body.userId !== 'string' || !body.userId.trim()) {
        return NextResponse.json({
          success: false,
          code: 'CLIENT_UPDATE_REQUIRED',
          error: 'Trang game đang dùng bản cũ. Nhấn Ctrl+Shift+R rồi vào lại phòng bằng mã phòng. / Reload this page and rejoin the room.',
        }, { status: 409 });
      }
      if (body.userId !== room.host.id) return NextResponse.json({ success: false, error: 'Chỉ chủ phòng hiện tại được bắt đầu trận. Hãy vào lại phòng để cập nhật. / Only the current host can start.' }, { status: 403 });
      if (room.status === 'playing' && room.battleState) return NextResponse.json({ success: true, room });

      const readyPlayers = room.participants || [room.host, ...(room.guest ? [room.guest] : [])];
      const minPlayers = room.gameMode === 'last_man_standing' ? 3 : 2;
      if (readyPlayers.length < minPlayers || readyPlayers.some((p) => !p.isReady)) {
        return NextResponse.json(
          {
            success: false,
            error:
              room.gameMode === 'last_man_standing'
                ? `Cần tối thiểu 3 người chơi và tất cả đều sẵn sàng để bắt đầu (hiện có: ${readyPlayers.length}/4)`
                : 'Cần tất cả người chơi sẵn sàng để bắt đầu',
          },
          { status: 409 }
        );
      }
      if (!room.guest) {
        return NextResponse.json(
          { success: false, error: 'Cần ít nhất 2 người chơi để bắt đầu' },
          { status: 400 }
        );
      }

      const p1Class = CLASS_DEFINITIONS[room.host.classType] || CLASS_DEFINITIONS.warrior;
      const p2Class = CLASS_DEFINITIONS[room.guest.classType] || CLASS_DEFINITIONS.warrior;
      const p1Weapon = WEAPON_DEFINITIONS[room.host.weaponId] || WEAPON_DEFINITIONS.greatsword;
      const p2Weapon = WEAPON_DEFINITIONS[room.guest.weaponId] || WEAPON_DEFINITIONS.greatsword;

      const p1IsAttacker = Math.random() > 0.5;

      const player1: PlayerState = {
        id: room.host.id,
        name: room.host.name,
        character: room.host.character,
        classType: room.host.classType,
        weapon: p1Weapon,
        hp: p1Class.baseHp,
        maxHp: p1Class.baseHp,
        skillCharge: 0,
        isAttacker: p1IsAttacker,
        bullets: p1Weapon.id === 'revolver' ? 6 : undefined,
        petRockHp: (p1Weapon.id === 'spirit_stone' || p1Weapon.id === 'pet_rock') ? 0 : undefined,
        petRockHits: 0,
        petRockEnraged: false,
        statusEffects: {},
      };

      const player2: PlayerState = {
        id: room.guest.id,
        name: room.guest.name,
        character: room.guest.character,
        classType: room.guest.classType,
        weapon: p2Weapon,
        hp: p2Class.baseHp,
        maxHp: p2Class.baseHp,
        skillCharge: 0,
        isAttacker: !p1IsAttacker,
        bullets: p2Weapon.id === 'revolver' ? 6 : undefined,
        petRockHp: (p2Weapon.id === 'spirit_stone' || p2Weapon.id === 'pet_rock') ? 50 : undefined,
        petRockHits: 0,
        petRockEnraged: false,
        statusEffects: {},
      };

      const initialBattle: BattleState = {
        id: 'battle_' + room.code + '_' + Date.now(),
        player1,
        player2,
        currentTurn: 1,
        attackerId: p1IsAttacker ? player1.id : player2.id,
        phase: 'rolling_d20',
        turnStep: 'd20_atk',
        d20Results: null,
        d6Results: null,
        battleLog: [
          {
            turn: 1,
            type: 'system',
            message: `ONLINE DUEL COMMENCED! ${p1IsAttacker ? player1.name : player2.name} strikes first as ATTACKER!`,
            messageVi: `TRẬN ĐẤU BẮT ĐẦU! ${p1IsAttacker ? player1.name : player2.name} đi trước ở vị thế TẤN CÔNG!`,
            timestamp: Date.now(),
          },
        ],
        winnerId: null,
        mapId: room.mapId,
        isAiOpponent: false,
        mode: room.mode,
      };

      if (room.gameMode === 'last_man_standing') initialBattle.lms = createLms(readyPlayers);
      room.status = 'playing';
      room.battleState = initialBattle;
      await updateRoom(room);
      return NextResponse.json({ success: true, room });
    }

    // 4. BATTLE UPDATE (Action Sync from either player)
    if (action === 'battle_update') {
      const { battleState } = body;
      if (body.userId !== room.host.id && body.userId !== room.guest?.id) return NextResponse.json({ success: false }, { status: 403 });
      if (room.status !== 'playing' || !room.battleState || body.expectedRevision !== (room.battleState.revision ?? 0)) return NextResponse.json({ success: false, room }, { status: 409 });
      if (battleState && battleState.id === room.battleState.id) {
        battleState.revision = (room.battleState.revision ?? 0) + 1;
        room.battleState = battleState;
        if (battleState.winnerId) {
          room.status = 'finished';
          if (room.mode === 'ranked' && !room.rankedResultRecorded) {
            const winnerId = battleState.winnerId;
            const loserId = winnerId === room.host.id ? room.guest?.id : room.host.id;
            if (loserId) {
              const [winner, loser] = await Promise.all([getUserByIdAsync(winnerId), getUserByIdAsync(loserId)]);
              if (winner && loser) {
                const expected = 1 / (1 + Math.pow(10, (loser.rankPoints - winner.rankPoints) / 400));
                const delta = Math.max(15, Math.min(35, Math.round(32 * (1 - expected))));
                winner.rankPoints += delta;
                winner.tier = calculateTier(winner.rankPoints);
                winner.wins += 1;
                loser.rankPoints = Math.max(0, loser.rankPoints - delta);
                loser.tier = calculateTier(loser.rankPoints);
                loser.losses += 1;
                await Promise.all([saveUserAsync(winner), saveUserAsync(loser)]);
                room.rankedResultRecorded = true;
              }
            }
          }
        }
        await updateRoom(room);
      }
      return NextResponse.json({ success: true, room });
    }

    // 5. LEAVE ROOM
    if (action === 'leave') {
      const { userId } = body;
      if (room.host.id === userId) {
        // Host left - delete room
        await deleteRoom(room.code);
        return NextResponse.json({ success: true, message: 'Room deleted' });
      } else if (room.guest && room.guest.id === userId) {
        room.guest = null;
        room.status = 'waiting';
        await updateRoom(room);
        return NextResponse.json({ success: true, room });
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
