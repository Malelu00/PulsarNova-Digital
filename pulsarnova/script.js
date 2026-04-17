const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.getAttribute('id'); });
    navLinks.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === '#' + current) a.classList.add('active');
    });
  });

  const form = document.getElementById("contactForm");

  form.addEventListener("submit", function() {
    const data = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      service: document.getElementById("service").value,
      message: document.getElementById("message").value
    };

    localStorage.setItem("formData", JSON.stringify(data));
  });