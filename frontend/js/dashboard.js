document.addEventListener("DOMContentLoaded", () => {
  fetch("http://localhost:3000/api/presenze/oggi")
    .then(res => res.json())
    .then(data => {
      document.getElementById("presenzeOggi").innerText = JSON.stringify(data);
    });

  fetch("http://localhost:3000/api/presenze/statistiche")
    .then(res => res.json())
    .then(data => {
      document.getElementById("statisticheMensili").innerText = JSON.stringify(data);
    });
});
