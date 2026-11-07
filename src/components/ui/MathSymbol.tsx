export default function MathSymbol({value}:{value:'+'|'-'|'='|'<'|'>'}){
 const path=value==='+'?'M3 12h18M12 3v18':value==='-'?'M3 12h18':value==='='?'M3 8h18M3 16h18':value==='<'?'m18 3-12 9 12 9':'m6 3 12 9-12 9';
 return <svg className="math-sign" viewBox="0 0 24 24" role="img" aria-label={value}><path d={path} stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="square" strokeLinejoin="miter"/></svg>;
}
