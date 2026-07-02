const API_BASE = "";

const TOKEN =
  localStorage.getItem("token") || "";

async function loadStats() {
  try {
    const response = await fetch(
      `${API_BASE}/api/admin/stats`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!data.success) return;

    document.getElementById(
      "shopsCount"
    ).textContent = data.stats.shops;

    document.getElementById(
      "usersCount"
    ).textContent = data.stats.users;

    document.getElementById(
      "ordersCount"
    ).textContent = data.stats.orders;

    document.getElementById(
      "revenueCount"
    ).textContent =
      `₹${data.stats.revenue}`;
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadShops() {
  try {
    const response = await fetch(
      `${API_BASE}/api/admin/shops`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!data.success) return;

    renderShops(data.shops);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function renderShops(shops) {
  const table =
    document.getElementById("shopsTable");

  table.innerHTML = "";

  shops.forEach(shop => {
    const row = document.createElement("tr");

    const actionButton =
      shop.status === "active"
        ? `
          <button
            class="danger-btn"
            onclick="suspendShop('${shop.shopId}')"
          >
            Suspend
          </button>
        `
        : `
          <button
            class="success-btn"
            onclick="activateShop('${shop.shopId}')"
          >
            Activate
          </button>
        `;

    row.innerHTML = `
      <td>${shop.shopName || "-"}</td>
      <td>${shop.ownerName || "-"}</td>
      <td>
        <span class="badge ${shop.status}">
          ${shop.status}
        </span>
      </td>
      <td>
        ${shop.subscriptionStatus || "active"}
      </td>
      <td>
        ${actionButton}
      </td>
    `;

    table.appendChild(row);
  });
}

async function suspendShop(shopId) {
  try {
    const response = await fetch(
      `${API_BASE}/api/admin/shops/${shopId}/suspend`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      showMessage(
        "Shop suspended successfully"
      );
      loadShops();
    }
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function activateShop(shopId) {
  try {
    const response = await fetch(
      `${API_BASE}/api/admin/shops/${shopId}/activate`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      showMessage(
        "Shop activated successfully"
      );
      loadShops();
    }
  } catch (error) {
    showMessage(error.message, true);
  }
}

function showMessage(
  message,
  isError = false
) {
  const box =
    document.getElementById("messageBox");

  box.textContent = message;

  box.className = isError
    ? "message error"
    : "message success";

  setTimeout(() => {
    box.className = "";
    box.textContent = "";
  }, 4000);
}

document
  .getElementById("refreshBtn")
  .addEventListener("click", () => {
    loadStats();
    loadShops();
  });

loadStats();
loadShops();

setInterval(() => {
  loadStats();
  loadShops();
}, 30000);