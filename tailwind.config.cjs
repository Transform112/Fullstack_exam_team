module.exports = {
 content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './templates/**/*.{ts,tsx}', './sections/**/*.{ts,tsx}'],
 theme: { extend: {
 colors: {primary:'#442b46',accent:'#b45145',sunshine:'#e6b967',ink:'#352c32',canvas:'#faf7f0',success:'#457259',muted:'#71676a',border:'#ddd7cd'},
 fontFamily:{heading:['Georgia','serif']},
 borderRadius:{card:'12px'}, boxShadow:{card:'0 4px 20px rgba(68,43,70,.045)'}
 }}, plugins: []
};
