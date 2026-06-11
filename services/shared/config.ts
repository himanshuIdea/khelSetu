export const servicePorts = {
  gateway: Number(process.env.GATEWAY_PORT ?? 4000),
  academy: Number(process.env.ACADEMY_SERVICE_PORT ?? 4001),
  people: Number(process.env.PEOPLE_SERVICE_PORT ?? 4002),
  operations: Number(process.env.OPERATIONS_SERVICE_PORT ?? 4003),
  competitions: Number(process.env.COMPETITIONS_SERVICE_PORT ?? 4004),
  inventory: Number(process.env.INVENTORY_SERVICE_PORT ?? 4005),
  payroll: Number(process.env.PAYROLL_SERVICE_PORT ?? 4006),
} as const;

export const serviceUrls = {
  academy: process.env.ACADEMY_SERVICE_URL ?? `http://localhost:${servicePorts.academy}`,
  people: process.env.PEOPLE_SERVICE_URL ?? `http://localhost:${servicePorts.people}`,
  operations: process.env.OPERATIONS_SERVICE_URL ?? `http://localhost:${servicePorts.operations}`,
  competitions: process.env.COMPETITIONS_SERVICE_URL ?? `http://localhost:${servicePorts.competitions}`,
  inventory: process.env.INVENTORY_SERVICE_URL ?? `http://localhost:${servicePorts.inventory}`,
  payroll: process.env.PAYROLL_SERVICE_URL ?? `http://localhost:${servicePorts.payroll}`,
} as const;

export const gatewayUrl =
  process.env.API_GATEWAY_URL ?? `http://localhost:${servicePorts.gateway}`;
