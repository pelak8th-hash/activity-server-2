const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);


// ==========================================
// تست سرور
// ==========================================

app.get("/", (req, res) => {

    res.json({
        status: "ok",
        service: "activity-server-2"
    });

});


// ==========================================
// افراد
// ==========================================


// دریافت همه افراد
app.get("/people", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("people")
            .select(`
                id,
                first_name,
                last_name,
                created_at
            `)
            .order("id", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        // دریافت شماره تلفن‌ها
        const peopleWithPhones = await Promise.all(

            (data || []).map(async person => {

                const {
                    data: phones,
                    error: phoneError
                } = await supabase
                    .from("person_phones")
                    .select(`
                        id,
                        phone,
                        created_at
                    `)
                    .eq("person_id", person.id)
                    .order("created_at", {
                        ascending: true
                    });


                if (phoneError) {

                    console.error(phoneError);

                    return {
                        ...person,
                        phones: []
                    };

                }


                return {
                    ...person,
                    phones: phones || []
                };

            })

        );


        res.json(peopleWithPhones);

    } catch (error) {

        console.error(
            "GET PEOPLE ERROR:",
            error
        );

        res.status(500).json({
            error: "خطا در دریافت افراد"
        });

    }

});


// ==========================================
// افزودن فرد
// ==========================================

app.post("/people", async (req, res) => {

    try {

        const {
            first_name,
            last_name
        } = req.body;


        if (
            typeof first_name !== "string" ||
            typeof last_name !== "string" ||
            !first_name.trim() ||
            !last_name.trim()
        ) {

            return res.status(400).json({
                error: "نام و نام خانوادگی الزامی است"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("people")
            .insert([
                {
                    first_name:
                        first_name.trim(),

                    last_name:
                        last_name.trim()
                }
            ])
            .select()
            .single();


        if (error) {
            throw error;
        }


        res.status(201).json(data);

    } catch (error) {

        console.error(
            "ADD PERSON ERROR:",
            error
        );

        res.status(500).json({
            error: "خطا در ثبت فرد"
        });

    }

});


// ==========================================
// ویرایش فرد
// ==========================================

app.put("/people/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        const {
            first_name,
            last_name
        } = req.body;


        if (!Number.isInteger(id)) {

            return res.status(400).json({
                error: "شناسه فرد نامعتبر است"
            });

        }


        if (
            typeof first_name !== "string" ||
            typeof last_name !== "string" ||
            !first_name.trim() ||
            !last_name.trim()
        ) {

            return res.status(400).json({
                error: "نام و نام خانوادگی الزامی است"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("people")
            .update({

                first_name:
                    first_name.trim(),

                last_name:
                    last_name.trim()

            })
            .eq("id", id)
            .select()
            .single();


        if (error) {
            throw error;
        }


        res.json(data);

    } catch (error) {

        console.error(
            "EDIT PERSON ERROR:",
            error
        );

        res.status(500).json({
            error: "خطا در ویرایش فرد"
        });

    }

});


// ==========================================
// حذف فرد
// ==========================================

app.delete("/people/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({
                error: "شناسه فرد نامعتبر است"
            });

        }


        const {
            error
        } = await supabase
            .from("people")
            .delete()
            .eq("id", id);


        if (error) {
            throw error;
        }


        res.json({
            message:
                "فرد با موفقیت حذف شد"
        });

    } catch (error) {

        console.error(
            "DELETE PERSON ERROR:",
            error
        );

        res.status(500).json({
            error: "خطا در حذف فرد"
        });

    }

});


// ==========================================
// شماره تلفن‌ها
// ==========================================


// دریافت شماره‌های یک فرد
app.get("/people/:personId/phones", async (req, res) => {

    try {

        const personId =
            Number(req.params.personId);


        if (!Number.isInteger(personId)) {

            return res.status(400).json({
                error: "شناسه فرد نامعتبر است"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("person_phones")
            .select(`
                id,
                person_id,
                phone,
                created_at
            `)
            .eq("person_id", personId)
            .order("created_at", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        res.json(data || []);

    } catch (error) {

        console.error(
            "GET PHONES ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در دریافت شماره تلفن‌ها"
        });

    }

});


// افزودن شماره تلفن
app.post("/people/:personId/phones", async (req, res) => {

    try {

        const personId =
            Number(req.params.personId);


        const phone =
            String(req.body.phone || "").trim();


        if (!Number.isInteger(personId)) {

            return res.status(400).json({
                error: "شناسه فرد نامعتبر است"
            });

        }


        if (!phone) {

            return res.status(400).json({
                error:
                    "شماره تلفن الزامی است"
            });

        }


        // بررسی وجود فرد
        const {
            data: person,
            error: personError
        } = await supabase
            .from("people")
            .select("id")
            .eq("id", personId)
            .single();


        if (personError || !person) {

            return res.status(404).json({
                error: "فرد پیدا نشد"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("person_phones")
            .insert([
                {
                    person_id:
                        personId,

                    phone:
                        phone
                }
            ])
            .select()
            .single();


        if (error) {
            throw error;
        }


        res.status(201).json(data);

    } catch (error) {

        console.error(
            "ADD PHONE ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در ثبت شماره تلفن"
        });

    }

});


// حذف شماره تلفن
app.delete("/phones/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({
                error:
                    "شناسه شماره تلفن نامعتبر است"
            });

        }


        const {
            error
        } = await supabase
            .from("person_phones")
            .delete()
            .eq("id", id);


        if (error) {
            throw error;
        }


        res.json({
            message:
                "شماره تلفن با موفقیت حذف شد"
        });

    } catch (error) {

        console.error(
            "DELETE PHONE ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در حذف شماره تلفن"
        });

    }

});


// ==========================================
// انواع فعالیت
// ==========================================


// دریافت انواع فعالیت
// Sessionها عمداً حذف می‌شوند
app.get("/activity-types", async (req, res) => {

    try {

        const {
            data,
            error
        } = await supabase
            .from("activity_types")
            .select(`
                id,
                name,
                points,
                category,
                setting_type,
                created_at
            `)
            .neq("setting_type", "sessions")
            .order("id", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        res.json(data || []);

    } catch (error) {

        console.error(
            "GET ACTIVITY TYPES ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در دریافت انواع فعالیت"
        });

    }

});


// افزودن نوع فعالیت
app.post("/activity-types", async (req, res) => {

    try {

        const name =
            String(req.body.name || "").trim();

        const points =
            Number(req.body.points);

        const category =
            String(req.body.category || "").trim();


        if (!name) {

            return res.status(400).json({
                error:
                    "نام فعالیت الزامی است"
            });

        }


        if (!Number.isInteger(points)) {

            return res.status(400).json({
                error:
                    "امتیاز باید عدد صحیح باشد"
            });

        }


        if (
            category !== "use" &&
            category !== "receive"
        ) {

            return res.status(400).json({
                error:
                    "دسته فعالیت باید use یا receive باشد"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("activity_types")
            .insert([
                {
                    name,
                    points,
                    category,
                    setting_type: "points"
                }
            ])
            .select()
            .single();


        if (error) {
            throw error;
        }


        res.status(201).json(data);

    } catch (error) {

        console.error(
            "ADD ACTIVITY TYPE ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در ثبت نوع فعالیت"
        });

    }

});


// ویرایش نوع فعالیت
app.patch("/activity-types/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({
                error:
                    "شناسه فعالیت نامعتبر است"
            });

        }


        const update = {};


        if (
            req.body.name !== undefined
        ) {

            const name =
                String(req.body.name).trim();


            if (!name) {

                return res.status(400).json({
                    error:
                        "نام فعالیت نمی‌تواند خالی باشد"
                });

            }


            update.name = name;

        }


        if (
            req.body.points !== undefined
        ) {

            const points =
                Number(req.body.points);


            if (!Number.isInteger(points)) {

                return res.status(400).json({
                    error:
                        "امتیاز باید عدد صحیح باشد"
                });

            }


            update.points = points;

        }


        if (
            req.body.category !== undefined
        ) {

            const category =
                String(req.body.category).trim();


            if (
                category !== "use" &&
                category !== "receive"
            ) {

                return res.status(400).json({
                    error:
                        "دسته فعالیت نامعتبر است"
                });

            }


            update.category =
                category;

        }


        if (
            Object.keys(update).length === 0
        ) {

            return res.status(400).json({
                error:
                    "اطلاعاتی برای ویرایش ارسال نشده است"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("activity_types")
            .update(update)
            .eq("id", id)
            .neq("setting_type", "sessions")
            .select()
            .single();


        if (error) {
            throw error;
        }


        res.json(data);

    } catch (error) {

        console.error(
            "EDIT ACTIVITY TYPE ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در ویرایش نوع فعالیت"
        });

    }

});


// ==========================================
// سوابق فعالیت یک شخص
// ==========================================

app.get("/activities/:personId", async (req, res) => {

    try {

        const personId =
            Number(req.params.personId);


        if (!Number.isInteger(personId)) {

            return res.status(400).json({
                error:
                    "شناسه فرد نامعتبر است"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("activities")
            .select(`
                id,
                person_id,
                activity_type_id,
                points,
                created_at,
                activity_types (
                    id,
                    name,
                    points,
                    category,
                    setting_type
                )
            `)
            .eq("person_id", personId)
            .order("created_at", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        const result =
            (data || [])
                .filter(activity =>

                    activity.activity_types?.setting_type
                    !== "sessions"

                )
                .map(activity => ({

                    id:
                        activity.id,

                    person_id:
                        activity.person_id,

                    activity_type_id:
                        activity.activity_type_id,

                    points:
                        activity.points,

                    created_at:
                        activity.created_at,

                    activity_type_name:
                        activity.activity_types?.name ||
                        "نامشخص",

                    category:
                        activity.activity_types?.category ||
                        "use"

                }));


        res.json(result);

    } catch (error) {

        console.error(
            "GET ACTIVITIES ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در دریافت سوابق فعالیت"
        });

    }

});


// ==========================================
// تابع مشترک ثبت فعالیت
// ==========================================

async function createActivity(
    personId,
    activityTypeId
) {

    // بررسی فرد
    const {
        data: person,
        error: personError
    } = await supabase
        .from("people")
        .select("id")
        .eq("id", personId)
        .single();


    if (
        personError ||
        !person
    ) {

        return {
            error:
                "فرد پیدا نشد",
            status: 404
        };

    }


    // دریافت نوع فعالیت
    const {
        data: activityType,
        error: typeError
    } = await supabase
        .from("activity_types")
        .select(`
            id,
            name,
            points,
            category,
            setting_type
        `)
        .eq("id", activityTypeId)
        .single();


    if (
        typeError ||
        !activityType
    ) {

        return {
            error:
                "نوع فعالیت پیدا نشد",
            status: 404
        };

    }


    // Session نباید به عنوان فعالیت ثبت شود
    if (
        activityType.setting_type === "sessions"
    ) {

        return {
            error:
                "سانس‌ها قابل ثبت به عنوان فعالیت نیستند",
            status: 400
        };

    }


    // ثبت فعالیت
    const {
        data,
        error
    } = await supabase
        .from("activities")
        .insert([
            {
                person_id:
                    personId,

                activity_type_id:
                    activityTypeId,

                points:
                    activityType.points
            }
        ])
        .select()
        .single();


    if (error) {

        console.error(error);

        return {
            error:
                "خطا در ثبت فعالیت",
            status: 500
        };

    }


    return {
        data: {

            ...data,

            activity_type_name:
                activityType.name,

            category:
                activityType.category

        },

        status: 201

    };

}


// ==========================================
// ثبت فعالیت
// ==========================================

app.post("/activities", async (req, res) => {

    try {

        const personId =
            Number(req.body.person_id);

        const activityTypeId =
            Number(req.body.activity_type_id);


        if (
            !Number.isInteger(personId) ||
            !Number.isInteger(activityTypeId)
        ) {

            return res.status(400).json({
                error:
                    "person_id و activity_type_id الزامی هستند"
            });

        }


        const result =
            await createActivity(
                personId,
                activityTypeId
            );


        return res
            .status(result.status)
            .json(
                result.data || {
                    error:
                        result.error
                }
            );

    } catch (error) {

        console.error(
            "ADD ACTIVITY ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در ثبت فعالیت"
        });

    }

});


// ==========================================
// ثبت فعالیت با شناسه شخص
// ==========================================

app.post(
    "/people/:personId/activities",
    async (req, res) => {

        try {

            const personId =
                Number(req.params.personId);

            const activityTypeId =
                Number(req.body.activity_type_id);


            if (
                !Number.isInteger(personId) ||
                !Number.isInteger(activityTypeId)
            ) {

                return res.status(400).json({
                    error:
                        "اطلاعات فعالیت نامعتبر است"
                });

            }


            const result =
                await createActivity(
                    personId,
                    activityTypeId
                );


            return res
                .status(result.status)
                .json(
                    result.data || {
                        error:
                            result.error
                    }
                );

        } catch (error) {

            console.error(
                "ADD PERSON ACTIVITY ERROR:",
                error
            );

            res.status(500).json({
                error:
                    "خطا در ثبت فعالیت"
            });

        }

    }
);


// ==========================================
// ویرایش یک فعالیت
// ==========================================

app.patch("/activities/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const activityTypeId =
            Number(req.body.activity_type_id);


        if (
            !Number.isInteger(id) ||
            !Number.isInteger(activityTypeId)
        ) {

            return res.status(400).json({
                error:
                    "اطلاعات نامعتبر است"
            });

        }


        // دریافت نوع جدید
        const {
            data: activityType,
            error: typeError
        } = await supabase
            .from("activity_types")
            .select(`
                id,
                name,
                points,
                category,
                setting_type
            `)
            .eq("id", activityTypeId)
            .single();


        if (
            typeError ||
            !activityType
        ) {

            return res.status(404).json({
                error:
                    "نوع فعالیت پیدا نشد"
            });

        }


        if (
            activityType.setting_type === "sessions"
        ) {

            return res.status(400).json({
                error:
                    "سانس قابل انتخاب برای فعالیت نیست"
            });

        }


        const {
            data,
            error
        } = await supabase
            .from("activities")
            .update({

                activity_type_id:
                    activityTypeId,

                points:
                    activityType.points

            })
            .eq("id", id)
            .select()
            .single();


        if (error) {
            throw error;
        }


        res.json({

            ...data,

            activity_type_name:
                activityType.name,

            category:
                activityType.category

        });

    } catch (error) {

        console.error(
            "EDIT ACTIVITY ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در ویرایش فعالیت"
        });

    }

});


// ==========================================
// حذف یک فعالیت
// ==========================================

app.delete("/activities/:id", async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({
                error:
                    "شناسه فعالیت نامعتبر است"
            });

        }


        const {
            error
        } = await supabase
            .from("activities")
            .delete()
            .eq("id", id);


        if (error) {
            throw error;
        }


        res.json({
            message:
                "فعالیت با موفقیت حذف شد"
        });

    } catch (error) {

        console.error(
            "DELETE ACTIVITY ERROR:",
            error
        );

        res.status(500).json({
            error:
                "خطا در حذف فعالیت"
        });

    }

});


// ==========================================
// اجرای سرور
// ==========================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
