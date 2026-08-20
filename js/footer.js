/* ============ OVEN DIARIES — FOOTER ============ */

function injectFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
  <div class="container">
    <div class="footer-grid">
      <div class="footer-about">
        <a href="index.html" class="logo"><img class="logo-img" src="images/logo.jpg" alt="Oven Diaries">
          <span class="logo-text">Oven <span>Diaries</span></span></a>
        <p>Karachi's warmest little bakery — cream cakes, crispy fast food and custom bakes, made fresh every single morning since 2012.</p>
        <div class="socials">
          <a href="#" title="Facebook" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" title="Instagram" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" title="WhatsApp" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
          <a href="#" title="TikTok" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Quick Links</h4>
        <ul class="footer-links">
          <li><a href="index.html"><i class="fa-solid fa-house"></i> Home</a></li>
          <li><a href="bakery.html"><i class="fa-solid fa-cake-candles"></i> Bakery Shop</a></li>
          <li><a href="custom-cake.html"><i class="fa-solid fa-palette"></i> Custom Cake</a></li>
          <li><a href="track-order.html"><i class="fa-solid fa-truck-fast"></i> Track Order</a></li>
          <li><a href="about.html"><i class="fa-solid fa-heart"></i> About Us</a></li>
          <li><a href="cart.html"><i class="fa-solid fa-basket-shopping"></i> My Cart</a></li>
          <li><a href="profile.html"><i class="fa-solid fa-user"></i> Account</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>More</h4>
        <ul class="footer-links">
          <li><a href="about.html#team"><i class="fa-solid fa-people-group"></i> Team</a></li>
          <li><a href="about.html#developers"><i class="fa-solid fa-laptop-code"></i> Developers</a></li>
          <li><a href="about.html#contact"><i class="fa-solid fa-envelope"></i> Contact</a></li>
          <li><a href="about.html#complaints"><i class="fa-solid fa-circle-exclamation"></i> Complaints</a></li>
          <li><a href="about.html#privacy"><i class="fa-solid fa-shield-halved"></i> Privacy Policy</a></li>
          <li><a href="about.html#returns"><i class="fa-solid fa-rotate-left"></i> Returns &amp; Refunds</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <b data-year>2026</b> Oven Diaries Bakery. Freshly baked with love in Pakistan.</span>
    </div>
  </div>`;
  renderYear();
}
