export const maskRG = (value: string) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, '').slice(0, 5);
  if (clean.length > 2) {
    return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  }
  return clean;
};

export const maskCPF = (value: string) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, '').slice(0, 11);
  let masked = clean;
  if (clean.length > 9) {
    masked = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  } else if (clean.length > 6) {
    masked = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  } else if (clean.length > 3) {
    masked = `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  return masked;
};

export const maskPhone = (value: string) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, '').slice(0, 11);
  let masked = clean;
  if (clean.length > 10) {
    masked = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  } else if (clean.length > 6) {
    masked = `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  } else if (clean.length > 2) {
    masked = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  }
  return masked;
};

export const formatRG = (rg: string) => {
  if (!rg) return "—";
  const clean = rg.replace(/\D/g, '');
  if (clean.length >= 5) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}`;
  }
  return rg;
};

export const formatCPF = (cpf: string) => {
  if (!cpf) return "—";
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
  }
  return cpf;
};

export const formatPhone = (phone: string) => {
  if (!phone) return "—";
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
  }
  return phone;
};
