import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const form = document.querySelector(".quote-form");
const message = document.querySelector(".form-message");
const customerForm = document.querySelector("[data-customer-form]");
const customerMessage = document.querySelector(".customer-message");
const customerSubmit = document.querySelector("[data-customer-submit]");

// Initial Animations
window.addEventListener('load', () => {
  gsap.from(".site-header", {
    y: -100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out"
  });

  gsap.from(".hero-content > *", {
    y: 50,
    opacity: 0,
    stagger: 0.2,
    duration: 1,
    ease: "power3.out",
    delay: 0.5
  });

  gsap.from(".hero-image", {
    scale: 1.2,
    opacity: 0,
    duration: 2,
    ease: "power2.out"
  });

  // Force ScrollTrigger to refresh its positions after the page is fully loaded
  ScrollTrigger.refresh();
});

// Scroll Animations
gsap.utils.toArray('.section-heading').forEach(heading => {
  gsap.from(heading, {
    scrollTrigger: {
      trigger: heading,
      start: "top 80%",
    },
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power3.out"
  });
});

gsap.utils.toArray('.product-card, .item-option, article').forEach(card => {
  gsap.from(card, {
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
    },
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    stagger: 0.1
  });
});

// Form Logic
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "Thanks. Your inquiry is ready to send from this demo form.";
  form.reset();
  gsap.from(message, { opacity: 0, y: 10, duration: 0.5 });
});

customerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(customerForm);
  const customer = {
    name: formData.get("customerName"),
    phone: formData.get("customerPhone"),
    address: formData.get("customerAddress"),
    submitted: true,
  };

  localStorage.setItem("armCustomerDetails", JSON.stringify(customer));
  customerMessage.textContent = "Customer details submitted. Payment is now enabled.";
  customerSubmit.classList.remove("needs-attention");
  gsap.from(customerMessage, { opacity: 0, y: 10, duration: 0.5 });
});

if (new URLSearchParams(window.location.search).get("customer") === "required") {
  customerSubmit?.classList.add("needs-attention");
  customerMessage.textContent = "Submit customer details before payment.";
}

// --- Magnetic Button Effect ---
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.hero-cta button, .nav-action, .cart-action, .payment-button');
  
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(btn, {
        x: x * 0.3,
        y: y * 0.3,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  });
}

// Initialize on load
window.addEventListener('load', () => {
  initMagneticButtons();
});