const btn=document.querySelector('.menu-btn'),list=document.querySelector('.nav ul');
btn.addEventListener('click',()=>{const o=list.classList.toggle('open');btn.setAttribute('aria-expanded',o)});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
document.querySelectorAll('form[data-demo]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const email=f.querySelector('[name=email]');
const n=f.querySelector('.note');if(f.dataset.demo==='contact'){const d=new FormData(f);location.href='mailto:kingfisherandkite@gmail.com?subject='+encodeURIComponent('Inquiry from '+d.get('name'))+'&body='+encodeURIComponent(d.get('message')+'\n\n'+d.get('email'));}
n.textContent='Thank you! We will be in touch soon.';f.reset()}));
