import { query, rawQuery, getConnection } from "./db.js";

// Export fungsi query untuk digunakan di route API
export { query, rawQuery };

// Helper functions untuk User operations
export const User = {
  async findUnique(where) {
    const conditions = [];
    const params = [];

    if (where.id) {
      conditions.push("id = ?");
      params.push(where.id);
    }
    if (where.email) {
      conditions.push("email = ?");
      params.push(where.email);
    }

    const sql = `SELECT * FROM users WHERE ${conditions.join(" AND ")} LIMIT 1`;
    const results = await query(sql, params);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM users";
    const params = [];

    if (options.where) {
      const conditions = [];
      if (options.where.role) {
        conditions.push("role = ?");
        params.push(options.where.role);
      }
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }
    }

    if (options.orderBy) {
      if (options.orderBy.createdAt) {
        sql += ` ORDER BY created_at ${options.orderBy.createdAt.toUpperCase()}`;
      }
    }

    return await query(sql, params);
  },

  async create(data) {
    const sql = `
      INSERT INTO users (email, password, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [data.email, data.password, data.name, data.role || "user"];
    const result = await query(sql, params);

    // Return the created user
    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    if (data.name !== undefined) {
      setClauses.push("name = ?");
      params.push(data.name);
    }
    if (data.email !== undefined) {
      setClauses.push("email = ?");
      params.push(data.email);
    }
    if (data.password !== undefined) {
      setClauses.push("password = ?");
      params.push(data.password);
    }
    if (data.role !== undefined) {
      setClauses.push("role = ?");
      params.push(data.role);
    }

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },
};

// Helper functions untuk Patient operations
export const Patient = {
  async findUnique(where) {
    const conditions = [];
    const params = [];

    if (where.id) {
      conditions.push("id = ?");
      params.push(where.id);
    }
    if (where.mrNumber) {
      conditions.push("mr_number = ?");
      params.push(where.mrNumber);
    }

    const sql = `SELECT * FROM patients WHERE ${conditions.join(
      " AND "
    )} LIMIT 1`;
    const results = await query(sql, params);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM patients";
    const params = [];

    if (options.where) {
      const conditions = [];
      if (options.where.OR) {
        const orConditions = [];
        options.where.OR.forEach((condition) => {
          if (condition.name && condition.name.contains) {
            orConditions.push("name LIKE ?");
            params.push(`%${condition.name.contains}%`);
          }
          if (condition.nik && condition.nik.contains) {
            orConditions.push("nik LIKE ?");
            params.push(`%${condition.nik.contains}%`);
          }
          if (condition.mrNumber && condition.mrNumber.contains) {
            orConditions.push("mr_number LIKE ?");
            params.push(`%${condition.mrNumber.contains}%`);
          }
        });
        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(" OR ")})`);
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }
    }

    if (options.include && options.include.insurance) {
      // For now, just return patients without insurance data
      // You can implement JOIN if needed
    }

    if (options.take) {
      sql += ` LIMIT ${options.take}`;
    }

    return await query(sql, params);
  },

  async create(data) {
    const sql = `
      INSERT INTO patients (
        mr_number, name, nik, birth_date, gender, blood_type, 
        occupation, marital_status, nip, citizenship, address, 
        phone, email, province_id, province_name, city_id, city_name, 
        district_id, district_name, village_id, village_name, 
        postal_code, company_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      data.mrNumber,
      data.name,
      data.nik,
      data.birthDate,
      data.gender,
      data.bloodType,
      data.occupation,
      data.maritalStatus,
      data.nip,
      data.citizenship || "WNI",
      data.address,
      data.phone,
      data.email,
      data.provinceId,
      data.provinceName,
      data.cityId,
      data.cityName,
      data.districtId,
      data.districtName,
      data.villageId,
      data.villageName,
      data.postalCode,
      data.companyId,
    ];

    const result = await query(sql, params);
    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && key !== "insurance") {
        const dbKey =
          key === "mrNumber"
            ? "mr_number"
            : key === "birthDate"
            ? "birth_date"
            : key === "bloodType"
            ? "blood_type"
            : key === "maritalStatus"
            ? "marital_status"
            : key === "provinceId"
            ? "province_id"
            : key === "provinceName"
            ? "province_name"
            : key === "cityId"
            ? "city_id"
            : key === "cityName"
            ? "city_name"
            : key === "districtId"
            ? "district_id"
            : key === "districtName"
            ? "district_name"
            : key === "villageId"
            ? "village_id"
            : key === "villageName"
            ? "village_name"
            : key === "postalCode"
            ? "postal_code"
            : key === "companyId"
            ? "company_id"
            : key;

        setClauses.push(`${dbKey} = ?`);
        params.push(data[key]);
      }
    });

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE patients SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM patients WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },

  async findFirst(options) {
    let sql = "SELECT * FROM patients";
    const params = [];

    if (options.where) {
      const conditions = [];

      // Handle mrNumber startsWith
      if (options.where.mrNumber && options.where.mrNumber.startsWith) {
        conditions.push("mr_number LIKE ?");
        params.push(`${options.where.mrNumber.startsWith}%`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }
    }

    // Handle orderBy
    if (options.orderBy) {
      if (options.orderBy.mrNumber) {
        sql += ` ORDER BY mr_number ${options.orderBy.mrNumber.toUpperCase()}`;
      }
    }

    sql += " LIMIT 1";

    const results = await query(sql, params);
    return results[0] || null;
  },
};

// Helper functions untuk Company operations
export const Company = {
  async findUnique(where) {
    const sql = "SELECT * FROM companies WHERE id = ? LIMIT 1";
    const results = await query(sql, [where.id]);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM companies";

    if (options.orderBy && options.orderBy.name) {
      sql += ` ORDER BY name ${options.orderBy.name.toUpperCase()}`;
    }

    return await query(sql);
  },

  async create(data) {
    const sql = `
      INSERT INTO companies (name, address, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [data.name, data.address, data.phone, data.email];
    const result = await query(sql, params);

    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    ["name", "address", "phone", "email"].forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE companies SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM companies WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },
};

// Helper functions untuk Doctor operations
export const Doctor = {
  async findUnique(where) {
    const sql = "SELECT * FROM doctors WHERE id = ? LIMIT 1";
    const results = await query(sql, [where.id]);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM doctors";

    if (options.orderBy && options.orderBy.name) {
      sql += ` ORDER BY name ${options.orderBy.name.toUpperCase()}`;
    }

    return await query(sql);
  },

  async create(data) {
    const sql = `
      INSERT INTO doctors (name, license_number, specialization, phone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      data.name,
      data.licenseNumber,
      data.specialization,
      data.phone,
      data.email,
    ];
    const result = await query(sql, params);

    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    ["name", "licenseNumber", "specialization", "phone", "email"].forEach(
      (field) => {
        if (data[field] !== undefined) {
          const dbField = field === "licenseNumber" ? "license_number" : field;
          setClauses.push(`${dbField} = ?`);
          params.push(data[field]);
        }
      }
    );

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE doctors SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM doctors WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },
};

// Helper functions untuk Insurance operations
export const Insurance = {
  async findUnique(where) {
    const conditions = [];
    const params = [];

    if (where.id) {
      conditions.push("id = ?");
      params.push(where.id);
    }
    if (where.patientId) {
      conditions.push("patient_id = ?");
      params.push(where.patientId);
    }

    const sql = `SELECT * FROM insurance WHERE ${conditions.join(
      " AND "
    )} LIMIT 1`;
    const results = await query(sql, params);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM insurance";

    if (options.orderBy && options.orderBy.provider) {
      sql += ` ORDER BY provider ${options.orderBy.provider.toUpperCase()}`;
    }

    return await query(sql);
  },

  async create(data) {
    const sql = `
      INSERT INTO insurance (provider, number, type, status, patient_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const params = [
      data.provider,
      data.number,
      data.type,
      data.status,
      data.patientId,
    ];
    const result = await query(sql, params);

    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    ["provider", "number", "type", "status"].forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE insurance SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM insurance WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },

  async deleteMany(where) {
    const sql = "DELETE FROM insurance WHERE patient_id = ?";
    return await query(sql, [where.patientId]);
  },
};

// Helper functions untuk ICD operations
export const ICD = {
  async findUnique(where) {
    const sql = "SELECT * FROM icd_codes WHERE id = ? LIMIT 1";
    const results = await query(sql, [where.id]);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM icd_codes";

    if (options.orderBy && options.orderBy.code) {
      sql += ` ORDER BY code ${options.orderBy.code.toUpperCase()}`;
    }

    return await query(sql);
  },

  async create(data) {
    const sql = `
      INSERT INTO icd_codes (code, description, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `;
    const params = [data.code, data.description];
    const result = await query(sql, params);

    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    ["code", "description"].forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE icd_codes SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM icd_codes WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },
};

// Helper functions untuk Treatment operations
export const Treatment = {
  async findUnique(where) {
    const sql = "SELECT * FROM treatments WHERE id = ? LIMIT 1";
    const results = await query(sql, [where.id]);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM treatments";

    if (options.orderBy && options.orderBy.name) {
      sql += ` ORDER BY name ${options.orderBy.name.toUpperCase()}`;
    }

    return await query(sql);
  },

  async create(data) {
    const sql = `
      INSERT INTO treatments (name, code, price, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const params = [data.name, data.code, data.price];
    const result = await query(sql, params);

    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    ["name", "code", "price"].forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE treatments SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM treatments WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },
};

// Helper functions untuk Polyclinic operations
export const Polyclinic = {
  async findUnique(where) {
    const sql = "SELECT * FROM polyclinics WHERE id = ? LIMIT 1";
    const results = await query(sql, [where.id]);
    return results[0] || null;
  },

  async findMany(options = {}) {
    let sql = "SELECT * FROM polyclinics";

    if (options.orderBy && options.orderBy.name) {
      sql += ` ORDER BY name ${options.orderBy.name.toUpperCase()}`;
    }

    return await query(sql);
  },

  async create(data) {
    const sql = `
      INSERT INTO polyclinics (name, description, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `;
    const params = [data.name, data.description];
    const result = await query(sql, params);

    return await this.findUnique({ id: result.insertId });
  },

  async update(where, data) {
    const setClauses = [];
    const params = [];

    ["name", "description"].forEach((field) => {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    setClauses.push("updated_at = NOW()");

    const sql = `UPDATE polyclinics SET ${setClauses.join(", ")} WHERE id = ?`;
    params.push(where.id);

    await query(sql, params);
    return await this.findUnique(where);
  },

  async delete(where) {
    const sql = "DELETE FROM polyclinics WHERE id = ?";
    await query(sql, [where.id]);
    return { id: where.id };
  },
};

// Helper functions untuk PostalCode operations
export const PostalCode = {
  async findFirst(where) {
    const conditions = [];
    const params = [];

    if (where.code) {
      conditions.push("code = ?");
      params.push(where.code);
    }

    const sql = `SELECT * FROM postal_codes WHERE ${conditions.join(
      " AND "
    )} LIMIT 1`;
    const results = await query(sql, params);
    return results[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO postal_codes (code, city, province, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const params = [data.code, data.city, data.province];
    const result = await query(sql, params);

    return await this.findFirst({ code: data.code });
  },
};

// Transaction helper
export async function $transaction(operations) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const operation of operations) {
      // Execute each operation within the transaction
      if (typeof operation === "function") {
        const result = await operation();
        results.push(result);
      }
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Fungsi helper untuk operasi CRUD pasien (backward compatibility)
export async function getPatients(search = "", page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  let sql = "SELECT * FROM patients";
  let params = [];

  if (search) {
    sql += " WHERE name LIKE ? OR mrn LIKE ?";
    params = [`%${search}%`, `%${search}%`];
  }

  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  const patients = await query(sql, params);

  // Dapatkan total
  let countSql = "SELECT COUNT(*) as total FROM patients";
  if (search) {
    countSql += " WHERE name LIKE ? OR mrn LIKE ?";
  }

  const countResults = await query(
    countSql,
    search ? [`%${search}%`, `%${search}%`] : []
  );
  const total = countResults[0]?.total || 0;

  return {
    data: patients,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Export default object untuk kompatibilitas dengan code yang mungkin masih menggunakan prisma.* syntax
export default {
  user: User,
  patient: Patient,
  company: Company,
  doctor: Doctor,
  insurance: Insurance,
  icd: ICD,
  treatment: Treatment,
  polyclinic: Polyclinic,
  postalCode: PostalCode,
  $transaction,
  $disconnect: () => Promise.resolve(),
};
