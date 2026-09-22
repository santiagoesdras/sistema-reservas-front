import { z } from "zod";

export const reservaSchema = z
  .object({
    responsable: z.string().trim().min(3, "Escribe el nombre de quien reserva.").max(80, "El nombre no puede superar 80 caracteres."),
    motivo: z.string().trim().min(3, "Describe brevemente para qué necesitas el laboratorio.").max(200, "El motivo no puede superar 200 caracteres."),
    inicio: z.coerce.date({ error: "Selecciona la fecha y hora de inicio." }),
    fin: z.coerce.date({ error: "Selecciona la fecha y hora de finalización." }),
  })
  .refine((reserva) => reserva.fin > reserva.inicio, {
    message: "La finalización debe ser posterior al inicio.",
    path: ["fin"],
  })
  .refine((reserva) => reserva.inicio > new Date(), {
    message: "No puedes reservar en el pasado.",
    path: ["inicio"],
  });
