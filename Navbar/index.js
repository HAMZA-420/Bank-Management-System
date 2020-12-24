const burger = document.querySelector("i");
const target = document.querySelector(".nav-ul");

burger.addEventListener("click", () => {
  target.classList.toggle("visible");
});
