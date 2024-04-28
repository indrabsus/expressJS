import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: ['id', 'name', 'email']
        });
        res.json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data pengguna" });
    }
}

export const Register = async (req, res) => {
    const { name, email, password, confPassword } = req.body;

    // Validasi input kosong
    if (!name.trim() || !email.trim() || !password.trim() || !confPassword.trim()) {
        return res.status(400).json({ msg: "Semua kolom harus diisi" });
    }

    // Validasi email format menggunakan regex
    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailFormat.test(email)) {
        return res.status(400).json({ msg: "Format email tidak valid" });
    }

    // Validasi password
    if (password !== confPassword) {
        return res.status(400).json({ msg: "Password dan Confirm Password Tidak Sama" });
    }

    try {
        // Cek apakah email sudah terdaftar
        const existingUser = await Users.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ msg: "Email sudah terdaftar" });
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        // Create user
        await Users.create({
            name: name,
            email: email,
            password: hashPassword
        });

        res.json({ msg: "Register Berhasil" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Terjadi kesalahan saat melakukan registrasi" });
    }
}



export const Login = async (req, res) => {
    try {
        const user = await Users.findAll({
            where: {
                email: req.body.email
            }
        });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if (!match) return res.status(400).json({ msg: "Password Salah" });

        const userId = user[0].id;
        const name = user[0].name;
        const email = user[0].email;
        const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '20s'
        })
        const refreshToken = jwt.sign({ userId, name, email }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '1d'
        })
        await Users.update ({ refresh_token: refreshToken }, {
            where: {
                id: userId
            }
        })
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        })
        res.json ({ accessToken });
    } catch (error) {
        res.status(404).json({ msg: "Email Tidak Terdaftar" });
    }
}

export const Logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.sendStatus(204);
        const user = await Users.findAll({
            where: {
                refresh_token: refreshToken
            }
        });
        if (!user[0]) return res.sendStatus(204);
        const userId = user[0].id;
        await Users.update ({ refresh_token: null }, {
            where: {
                id: userId
            }
        })
        res.clearCookie('refreshToken');
        return res.sendStatus(200);
}
