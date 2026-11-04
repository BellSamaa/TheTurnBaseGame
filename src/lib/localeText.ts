import english from './locale-en.json';
const dictionary:Record<string,string>=english;
const fragments=Object.keys(dictionary).filter(key=>key.length>2).sort((a,b)=>b.length-a.length);
export function translateText(text:string,language:'en'|'vi'='en'):string{
 if(language==='vi'||!text)return text;
 const key=text.trim();
 if(dictionary[key])return text.replace(key,dictionary[key]);
 // Dynamic server messages contain names and values around fixed phrases.
 let output=text;
 for(const source of fragments)if(output.includes(source))output=output.split(source).join(dictionary[source]);
 return output;
}
