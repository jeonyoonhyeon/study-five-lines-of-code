// @ts-nocheck

const ORGANIZATION_ID_CSV_HEADER = "org_id";

async function main() {
  const options = parseOptions();
  const orgIds = await loadOrgIds(options);

  await createContractsToOrgs(orgIds);
}

main();

/*
  --- core functions ---
*/

async function createContractsToOrgs(orgIds: string[]) {
  for await (const orgId of orgIds) {
    const org = await getExistentOrg(orgId);

    await createContractItem(org);
  }
}

async function createContractItem(org) {
  if (org === undefined) {
    return;
  }

  const contractItem = buildContractItem(org);

  await persist(contractItem);
}

/*
  --- builder functions ---
*/

function buildContractItem(org) {
  const generatedId = IDGenerator();

  return {
    id: generatedId,
    organizationId: extractOrgId(org),
    name: "PREMIUM",
    licenses: [
      buildLicenseItem("male", 5_000),
      buildLicenseItem("female", 95_000),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function buildLicenseItem(gender: "male" | "female", totalCount: number) {
  const generatedId = IDGenerator();

  return {
    id: generatedId,
    gender: gender,
    totalCount,
    grantedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function extractOrgId(org) {
  return org.id;
}

/*
  --- persistence functions ---
*/

async function getExistentOrg(orgId: string) {
  return await client.get(orgId);
}

async function persist(orgItem) {
  await client.create(orgItem);
}

/*
  --- preprocess functions ---
*/

async function loadOrgIds(options) {
  const orgIds = [];

  await loadOrgIdsFromCSV(orgIds, options.csvFilePath);

  return orgIds;
}

function loadOrgIdsFromCSV(orgIds: string[], csvFilePath: string) {
  return new Promise((resolve) => {
    createReadStream(csvFilePath)
      .on("data", (raw) =>
        populateOrgIds(orgIds, raw[ORGANIZATION_ID_CSV_HEADER])
      )
      .on("end", () => {
        resolve(orgIds);
      });
  });
}

function populateOrgIds(orgIds: string[], item: any) {
  orgIds.push(item);
}

function parseOptions() {
  const options = commandLineArgs([
    { name: "csvFilePath", alias: "f", type: String },
  ]);

  validateOptions(options);

  return options;
}

function validateOptions(options) {
  if (!options.csvFilePath) {
    throw new Error("Missing csvFilePath option");
  }
}
