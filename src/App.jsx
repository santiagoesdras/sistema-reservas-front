import { useCallback, useEffect, useMemo, useState } from "react";
import { getSalas, postReserva } from "./api.js";
import { reservaSchema } from "./reservaSchema.js";

const FORM_INICIAL = { responsable: "", motivo: "", inicio: "", fin: "" };
const fechaHora = new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" });

function formatearFecha(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "Horario pendiente" : fechaHora.format(fecha);
}

function FieldError({ id, errors }) {
  if (!errors?.length) return null;
  return <small className="field-error" id={id} role="alert">{errors[0]}</small>;
}

function SalaCard({ sala, seleccionada, onSelect }) {
  const reservas = Array.isArray(sala.reservas) ? sala.reservas : [];
  return (
    <article className={`sala-card${seleccionada ? " sala-card--selected" : ""}`}>
      <div className="sala-card__topline">
        <span className="room-number">LAB {String(sala.id).padStart(2, "0")}</span>
        <span className="capacity">{sala.capacidad} lugares</span>
      </div>
      <h3>{sala.nombre}</h3>
      <p className="building">Edificio {sala.edificio}</p>
      <div className="reservas-lista">
        <p className="section-label">Próximas reservas</p>
        {reservas.length === 0 ? <p className="empty-copy">Sin reservas registradas.</p> : (
          <ul>
            {reservas.map((reserva) => (
              <li key={reserva.id}>
                <span>{formatearFecha(reserva.inicio)}</span>
                <strong>{reserva.responsable}</strong>
                <small>{reserva.motivo}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="select-room" type="button" onClick={() => onSelect(String(sala.id))}>
        {seleccionada ? "Laboratorio seleccionado" : "Reservar este laboratorio"}
      </button>
    </article>
  );
}

export default function App() {
  const [salas, setSalas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [salaId, setSalaId] = useState("");
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const salaSeleccionada = useMemo(
    () => salas.find((sala) => String(sala.id) === salaId),
    [salas, salaId],
  );

  const cargarSalas = useCallback(async (signal) => {
    setCargando(true);
    setErrorCarga("");
    try {
      setSalas(await getSalas({ signal }));
    } catch (error) {
      if (error.name !== "AbortError") setErrorCarga(error.message || "No se pudo conectar con la API.");
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => cargarSalas(controller.signal), 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cargarSalas]);

  function actualizarCampo(event) {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
    setErrores((actual) => ({ ...actual, [name]: undefined }));
    setMensaje(null);
  }

  function seleccionarSala(id) {
    setSalaId(id);
    setErrores((actual) => ({ ...actual, salaId: undefined }));
    document.getElementById("reserva-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function reservar(event) {
    event.preventDefault();
    setErrores({});
    setMensaje(null);
    if (!salaId) {
      setErrores({ salaId: ["Elige un laboratorio."] });
      return;
    }

    const validacion = reservaSchema.safeParse(form);
    if (!validacion.success) {
      setErrores(validacion.error.flatten().fieldErrors);
      return;
    }

    setEnviando(true);
    try {
      await postReserva(salaId, form);
      setMensaje({ tipo: "success", texto: "Reserva creada correctamente." });
      setForm(FORM_INICIAL);
      await cargarSalas();
    } catch (error) {
      if (error.status === 400 && Object.keys(error.detalles || {}).length > 0) setErrores(error.detalles);
      else setMensaje({ tipo: "error", texto: error.status === 404 ? "El laboratorio ya no existe." : error.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="ReservaLabs, ir al inicio"><span className="brand-mark">R</span><span>ReservaLabs</span></a>
        <a className="header-action" href="#reserva-form">Nueva reserva</a>
      </header>

      <main id="inicio">
        <section className="hero">
          <p className="eyebrow">Sistema de reservas universitarias</p>
          <h1>Encuentra tu espacio.<br /><em>Hazlo tuyo.</em></h1>
          <p className="hero-copy">Consulta los laboratorios y reserva el horario que necesitas desde un solo lugar.</p>
          <a className="primary-link" href="#laboratorios">Ver laboratorios <span>↓</span></a>
        </section>

        <section className="labs-section" id="laboratorios" aria-labelledby="labs-title">
          <div className="section-heading">
            <div><p className="eyebrow">Espacios disponibles</p><h2 id="labs-title">Laboratorios</h2></div>
            {!cargando && !errorCarga && <span className="room-count">{salas.length} en total</span>}
          </div>
          {cargando && <p className="status-panel" role="status">Cargando laboratorios…</p>}
          {errorCarga && (
            <div className="status-panel status-panel--error" role="alert">
              <p><strong>No pudimos cargar los laboratorios.</strong><br />{errorCarga}</p>
              <button type="button" onClick={() => cargarSalas()}>Intentar de nuevo</button>
            </div>
          )}
          {!cargando && !errorCarga && salas.length === 0 && <p className="status-panel">Todavía no hay laboratorios registrados.</p>}
          {!cargando && !errorCarga && salas.length > 0 && (
            <div className="salas-grid">
              {salas.map((sala) => <SalaCard key={sala.id} sala={sala} seleccionada={String(sala.id) === salaId} onSelect={seleccionarSala} />)}
            </div>
          )}
        </section>

        <section className="booking-section" aria-labelledby="booking-title">
          <div className="booking-intro">
            <p className="eyebrow">Tu próximo laboratorio</p>
            <h2 id="booking-title">Crea una reserva</h2>
            <p>Completa los datos. Validaremos el horario antes de enviarlo para que puedas corregirlo al instante.</p>
            <div className="security-note"><span aria-hidden="true">✓</span><p><strong>Validación doble</strong><br />Tus datos se revisan aquí y de nuevo en el servidor.</p></div>
          </div>

          <form className="booking-form" id="reserva-form" onSubmit={reservar} noValidate>
            <label htmlFor="salaId">Laboratorio</label>
            <select id="salaId" value={salaId} onChange={(event) => { setSalaId(event.target.value); setErrores((actual) => ({ ...actual, salaId: undefined })); }} aria-invalid={Boolean(errores.salaId)} aria-describedby={errores.salaId ? "salaId-error" : undefined}>
              <option value="">Elige un laboratorio</option>
              {salas.map((sala) => <option key={sala.id} value={sala.id}>{sala.nombre} · {sala.edificio}</option>)}
            </select>
            <FieldError id="salaId-error" errors={errores.salaId} />

            <label htmlFor="responsable">Responsable</label>
            <input id="responsable" name="responsable" type="text" value={form.responsable} onChange={actualizarCampo} placeholder="Tu nombre completo" maxLength="80" autoComplete="name" aria-invalid={Boolean(errores.responsable)} aria-describedby={errores.responsable ? "responsable-error" : undefined} />
            <FieldError id="responsable-error" errors={errores.responsable} />

            <label htmlFor="motivo">Motivo</label>
            <textarea id="motivo" name="motivo" value={form.motivo} onChange={actualizarCampo} placeholder="¿Para qué necesitas el laboratorio?" maxLength="200" rows="3" aria-invalid={Boolean(errores.motivo)} aria-describedby={errores.motivo ? "motivo-error" : undefined} />
            <FieldError id="motivo-error" errors={errores.motivo} />

            <div className="date-grid">
              <div>
                <label htmlFor="inicio">Inicio</label>
                <input id="inicio" name="inicio" type="datetime-local" value={form.inicio} onChange={actualizarCampo} aria-invalid={Boolean(errores.inicio)} aria-describedby={errores.inicio ? "inicio-error" : undefined} />
                <FieldError id="inicio-error" errors={errores.inicio} />
              </div>
              <div>
                <label htmlFor="fin">Finalización</label>
                <input id="fin" name="fin" type="datetime-local" value={form.fin} onChange={actualizarCampo} aria-invalid={Boolean(errores.fin)} aria-describedby={errores.fin ? "fin-error" : undefined} />
                <FieldError id="fin-error" errors={errores.fin} />
              </div>
            </div>

            {salaSeleccionada && <p className="selected-summary">Reservarás <strong>{salaSeleccionada.nombre}</strong>.</p>}
            {mensaje && <p className={`form-message form-message--${mensaje.tipo}`} role="status">{mensaje.texto}</p>}
            <button className="submit-button" type="submit" disabled={enviando || salas.length === 0}>{enviando ? "Creando reserva…" : "Confirmar reserva"}</button>
          </form>
        </section>
      </main>

      <footer><a className="brand" href="#inicio"><span className="brand-mark">R</span><span>ReservaLabs</span></a><p>Hecho para aprovechar mejor cada espacio.</p></footer>
    </div>
  );
}
