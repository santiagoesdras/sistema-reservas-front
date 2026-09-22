const configuredUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (configuredUrl || "http://localhost:3010").replace(/\/$/, "");

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return response.json();
}

export async function getSalas({ signal } = {}) {
  const response = await fetch(`${API_URL}/api/salas`, { signal });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data?.error || "No se pudieron cargar los laboratorios.");
  return Array.isArray(data) ? data : [];
}

export async function postReserva(salaId, reserva) {
  const response = await fetch(`${API_URL}/api/salas/${salaId}/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reserva),
  });
  const data = await readJson(response);
  if (!response.ok) {
    const error = new Error(data?.error || "No se pudo crear la reserva.");
    error.status = response.status;
    error.detalles = data?.detalles || {};
    throw error;
  }
  return data;
}
