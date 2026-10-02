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


// تست ساده سرور
app.get("/", (req, res) => {
    res.json({
        status: "ok",
        service: "activity-server-2"
    });
});


// دریافت لیست افراد
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


// افزودن فرد جدید
app.post("/people", async (req, res) => {
    const { first_name, last_name } = req.body;

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


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
