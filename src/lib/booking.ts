// Single booking-validation source, consumed by BOTH the client form and the
// server API route (A16 — multiple surfaces on the same data must share one contract).

export type GuestType = "frendz" | "outside";

export type BookingInput = {
  email: string;
  phone: string;
  guest_type: GuestType;
  room_number: string;
  accommodation: string;
  allergies: string;
  special_request: string;
};

export type ValidateResult =
  | { ok: true; value: BookingInput }
  | { ok: false; error: string };

export function validateBooking(b: Partial<BookingInput>): ValidateResult {
  const email = (b.email ?? "").trim();
  const phone = (b.phone ?? "").trim();
  const guest_type = b.guest_type;
  const room_number = (b.room_number ?? "").trim();
  const accommodation = (b.accommodation ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (phone.replace(/[\s()+-]/g, "").length < 6) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  if (guest_type !== "frendz" && guest_type !== "outside") {
    return { ok: false, error: "Please choose Frendz Guest or Outside Guest." };
  }
  if (guest_type === "frendz" && !room_number) {
    return { ok: false, error: "Please enter your Frendz room number." };
  }
  if (guest_type === "outside" && !accommodation) {
    return { ok: false, error: "Please enter your current accommodation." };
  }

  return {
    ok: true,
    value: {
      email,
      phone,
      guest_type,
      room_number,
      accommodation,
      allergies: (b.allergies ?? "").trim(),
      special_request: (b.special_request ?? "").trim(),
    },
  };
}
