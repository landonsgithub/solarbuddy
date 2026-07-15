const API_BASE_URL = 'http://localhost:4000/api';

async function parseJson(response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

export async function createLead(leadData) {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(leadData)
  });

  return parseJson(response);
}

export async function fetchLeads(filter = 'all') {
  const response = await fetch(`${API_BASE_URL}/leads?filter=${filter}`);
  return parseJson(response);
}

export async function fetchLeadStats() {
  const response = await fetch(`${API_BASE_URL}/leads/stats`);
  return parseJson(response);
}

export async function fetchCalendarBookingDays() {
  const response = await fetch(`${API_BASE_URL}/calendar/days`);
  return parseJson(response);
}

export async function fetchCalendarAvailability(date) {
  const response = await fetch(`${API_BASE_URL}/calendar/availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ date })
  });

  return parseJson(response);
}

export async function bookCalendarAppointment(appointmentData) {
  const response = await fetch(`${API_BASE_URL}/calendar/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appointmentData)
  });

  return parseJson(response);
}
