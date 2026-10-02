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

    const { data, error } = await supabase
        .from("people")
        .select("*")
        .order("id", { ascending: true });

    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در دریافت افراد"
        });

    }

    res.json(data);

});


// افزودن فرد
app.post("/people", async (req, res) => {

    const {
        first_name,
        last_name
    } = req.body;


    if (!first_name || !last_name) {

        return res.status(400).json({
            error: "نام و نام خانوادگی الزامی است"
        });

    }


    const { data, error } = await supabase
        .from("people")
        .insert([
            {
                first_name,
                last_name
            }
        ])
        .select()
        .single();


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در ثبت فرد"
        });

    }


    res.status(201).json(data);

});


// ویرایش فرد
app.put("/people/:id", async (req, res) => {

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


    if (!first_name || !last_name) {

        return res.status(400).json({
            error: "نام و نام خانوادگی الزامی است"
        });

    }


    const { data, error } = await supabase
        .from("people")
        .update({
            first_name,
            last_name
        })
        .eq("id", id)
        .select()
        .single();


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در ویرایش فرد"
        });

    }


    res.json(data);

});


// حذف فرد
app.delete("/people/:id", async (req, res) => {

    const id =
        Number(req.params.id);


    if (!Number.isInteger(id)) {

        return res.status(400).json({
            error: "شناسه فرد نامعتبر است"
        });

    }


    const { error } = await supabase
        .from("people")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در حذف فرد"
        });

    }


    res.json({
        message: "فرد با موفقیت حذف شد"
    });

});


// ==========================================
// انواع فعالیت
// ==========================================


app.get("/activity-types", async (req, res) => {

    const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .order("id", { ascending: true });


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در دریافت انواع فعالیت"
        });

    }


    res.json(data);

});


// ==========================================
// سوابق فعالیت یک شخص
// ==========================================


app.get("/activities/:personId", async (req, res) => {

    const personId =
        Number(req.params.personId);


    if (!Number.isInteger(personId)) {

        return res.status(400).json({
            error: "شناسه فرد نامعتبر است"
        });

    }


    const { data, error } = await supabase
        .from("activities")
        .select(`
            id,
            person_id,
            activity_type_id,
            points,
            created_at,
            activity_types (
                name
            )
        `)
        .eq("person_id", personId)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در دریافت سوابق فعالیت"
        });

    }


    const result = data.map(activity => ({

        id: activity.id,

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
            "نامشخص"

    }));


    res.json(result);

});


// ==========================================
// ثبت فعالیت
// ==========================================


app.post("/activities", async (req, res) => {

    const {
        person_id,
        activity_type_id
    } = req.body;


    if (!person_id || !activity_type_id) {

        return res.status(400).json({
            error:
                "person_id و activity_type_id الزامی هستند"
        });

    }


    // دریافت اطلاعات نوع فعالیت
    const {
        data: activityType,
        error: typeError
    } = await supabase
        .from("activity_types")
        .select("id, name, points")
        .eq("id", activity_type_id)
        .single();


    if (typeError || !activityType) {

        console.error(typeError);

        return res.status(404).json({
            error: "نوع فعالیت پیدا نشد"
        });

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
                    person_id,

                activity_type_id:
                    activity_type_id,

                points:
                    activityType.points
            }
        ])
        .select()
        .single();


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در ثبت فعالیت"
        });

    }


    res.status(201).json({

        ...data,

        activity_type_name:
            activityType.name

    });

});


// ==========================================
// حذف یک فعالیت
// ==========================================

app.delete("/activities/:id", async (req, res) => {

    const id =
        Number(req.params.id);


    if (!Number.isInteger(id)) {

        return res.status(400).json({
            error: "شناسه فعالیت نامعتبر است"
        });

    }


    const {
        error
    } = await supabase
        .from("activities")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

        return res.status(500).json({
            error: "خطا در حذف فعالیت"
        });

    }


    res.json({
        message: "فعالیت با موفقیت حذف شد"
    });

});


// ==========================================
// اجرای سرور
// ==========================================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
