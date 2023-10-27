// @ts-nocheck

const TABLE_NAMES = {
  stag: "org-stag",
  prod: "org-prod",
};

const ORGANIZATION_ID_CSV_HEADER = "org_id";

async function main() {
  const options = parseOptions();
  validateOptions(options);
  const organizationIds = await loadOrgIds(options.csvFilePath);

  await createContractsToOrgs(
    organizationIds,
    TABLE_NAMES[options.stage]
  );
}

main();

async function createContractsToOrgs(
  organizationIds: string[],
  tableName: string
) {
  for await (const organizationId of organizationIds) {
    const org = await client.get(organizationId);

    if (org === undefined) {
      continue;
    }

    await client.create(createContractItem(organizationId));
  }
}

function createContractItem(organizationId: string) {
  const generatedId = IDGenerator();

  return {
    id: generatedId,
    organizationId,
    name: "PREMIUM",
    licenses: [
      buildLicenseItem("male", 5_000),
      buildLicenseItem("female", 95_000),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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

/*
  --- preprocess functions ---
*/

function parseOptions() {
  return commandLineArgs([
    { name: "stage", alias: "s", type: String },
    { name: "csvFilePath", alias: "f", type: String },
  ]);
}

function validateOptions(options) {
  if (!options.stage) {
    throw new Error("Missing stage option");
  } else if (!TABLE_NAMES[options.stage]) {
    throw new Error("Invalid stage option");
  } else if (!options.csvFilePath) {
    throw new Error("Missing csvFilePath option");
  }
}

function loadOrgIds(csvFilePath): Promise<string[]> {
  return new Promise((resolve) => {
    const organizationIds = [];

    createReadStream(csvFilePath)
      .on("data", (raw) =>
        organizationIds.push(raw[ORGANIZATION_ID_CSV_HEADER])
      )
      .on("end", () => {
        resolve(organizationIds);
      });
  });
}
