require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const emailTemplate = require('./templates/emailTemplate');

const app = express();

const SITE_NAME = 'Qual Trabalho Você Precisa';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* REDIRECIONAR LOCALHOST */

app.get('/', (req, res) => {
  res.redirect('/pages/home.html');
});

/* MONGODB */

const client = new MongoClient(process.env.MONGO_URL);
let db;

async function connectDB() {
  await client.connect();

  db = client.db(process.env.DB_NAME);

  console.log('✅ MongoDB conectado');
}

connectDB();

/* UTIL */

function generateCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

/* JWT */

function generateToken(user) {
  return jwt.sign(
    {
      email: user.email,
      id: user._id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

async function sendCodeEmail({ to, code }) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY não configurada');
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'Qual Trabalho Você Precisa';

  if (!fromEmail) {
    throw new Error('EMAIL_FROM não configurado');
  }

  const html = emailTemplate(code);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',

    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },

    body: JSON.stringify({
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: 'Seu código de acesso',
      htmlContent: html,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Erro Brevo:', data);
    throw new Error(data.message || 'Erro ao enviar e-mail pela Brevo');
  }

  return data;
}

/* AUTH MIDDLEWARE */

function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.json({
      success: false,
      message: 'Token não enviado',
    });
  }

  try {
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch {
    return res.json({
      success: false,
      message: 'Token inválido',
    });
  }
}

/* ENVIAR CÓDIGO */

app.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: 'Email obrigatório',
      });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    await db.collection('codes').updateOne(
      { email },
      {
        $set: {
          email,
          code,
          expiresAt,
        },
      },
      { upsert: true }
    );

    await sendCodeEmail({
      to: email,
      code,
    });

    return res.json({
      success: true,
      message: 'Código enviado para seu e-mail.',
    });
  } catch (err) {
    console.error('Erro ao enviar código:', err);

    return res.json({
      success: false,
      message: err.message || 'Erro ao enviar código',
    });
  }
});

/* VERIFICAR LOGIN */

app.post('/verify-code', async (req, res) => {
  try {
    const { username, email, code } = req.body;

    if (!username || !email || !code) {
      return res.json({
        success: false,
        message: 'Dados incompletos',
      });
    }

    if (username.trim().length > 20) {
      return res.json({
        success: false,
        message: 'Nome de usuário muito grande',
      });
    }

    const record = await db.collection('codes').findOne({ email });

    if (!record) {
      return res.json({
        success: false,
        message: 'Código não encontrado',
      });
    }

    if (Date.now() > record.expiresAt) {
      await db.collection('codes').deleteOne({ email });

      return res.json({
        success: false,
        message: 'Código expirado',
      });
    }

    if (record.code !== code.toUpperCase()) {
      return res.json({
        success: false,
        message: 'Código inválido',
      });
    }

    await db.collection('codes').deleteOne({ email });

    let user = await db.collection('users').findOne({ email });

    if (!user) {
      const result = await db.collection('users').insertOne({
        email,
        name: username.trim().slice(0, 20),
        bio: '',
        createdAt: Date.now(),
        lastLogin: Date.now(),
      });

      user = {
        _id: result.insertedId,
        email,
        name: username.trim().slice(0, 20),
      };
    } else {
      await db.collection('users').updateOne(
        { email },
        {
          $set: {
            name: username.trim().slice(0, 20),
            lastLogin: Date.now(),
          },
        }
      );

      user.name = username.trim().slice(0, 20);
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro no servidor',
    });
  }
});

/* DASHBOARD */

app.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({
      email: req.user.email,
    });

    const services = await db
      .collection('services')
      .find({
        userEmail: req.user.email,
      })
      .toArray();

    const orders = await db
      .collection('orders')
      .find({
        $or: [
          { clientEmail: req.user.email },
          { providerEmail: req.user.email },
        ],
      })
      .toArray();

    return res.json({
      success: true,
      user,
      services,
      orders,
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao carregar dashboard',
    });
  }
});

/* CRIAR SERVIÇO */

app.post('/services', auth, async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      price,
      priceType,
      priceInCents,
      priceMinInCents,
      priceMaxInCents,
      city,
      area,
    } = req.body;

    if (!title || !category || !description || !price || !city) {
      return res.json({
        success: false,
        message: 'Preencha todos os campos',
      });
    }

    if (title.length > 50) {
      return res.json({
        success: false,
        message: 'O título deve ter no máximo 50 caracteres',
      });
    }

    if (description.length > 1000) {
      return res.json({
        success: false,
        message: 'A descrição deve ter no máximo 1000 caracteres',
      });
    }

    const user = await db.collection('users').findOne({
      email: req.user.email,
    });

    await db.collection('services').insertOne({
      title,
      category,
      description,

      price,
      priceType: priceType || 'fixed',

      priceInCents: Number(priceInCents) || 0,
      priceMinInCents: Number(priceMinInCents) || 0,
      priceMaxInCents: Number(priceMaxInCents) || 0,

      city,
      area: area || '',

      userEmail: req.user.email,

      ownerName: user?.name || 'Prestador',
      ownerProfession: user?.profession || '',
      ownerAvatar: user?.avatarUrl || '',
      ownerColor: user?.profileColor || '#ff6b6b',

      createdAt: Date.now(),
    });

    return res.json({
      success: true,
      message: 'Serviço criado com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao criar serviço',
    });
  }
});

/* EDITAR SERVIÇO */

app.put('/services/:id', auth, async (req, res) => {
  try {
    const serviceId = req.params.id;

    const {
      title,
      category,
      description,
      price,
      priceType,
      priceInCents,
      priceMinInCents,
      priceMaxInCents,
      city,
      area,
    } = req.body;

    if (!ObjectId.isValid(serviceId)) {
      return res.json({
        success: false,
        message: 'Serviço inválido',
      });
    }

    if (!title || !category || !description || !price || !city) {
      return res.json({
        success: false,
        message: 'Preencha todos os campos obrigatórios',
      });
    }

    if (title.length > 50) {
      return res.json({
        success: false,
        message: 'O título deve ter no máximo 50 caracteres',
      });
    }

    if (description.length > 1000) {
      return res.json({
        success: false,
        message: 'A descrição deve ter no máximo 1000 caracteres',
      });
    }

    const service = await db.collection('services').findOne({
      _id: new ObjectId(serviceId),
      userEmail: req.user.email,
    });

    if (!service) {
      return res.json({
        success: false,
        message: 'Serviço não encontrado ou sem permissão',
      });
    }

    await db.collection('services').updateOne(
      {
        _id: new ObjectId(serviceId),
        userEmail: req.user.email,
      },
      {
        $set: {
          title,
          category,
          description,

          price,
          priceType: priceType || 'fixed',

          priceInCents: Number(priceInCents) || 0,
          priceMinInCents: Number(priceMinInCents) || 0,
          priceMaxInCents: Number(priceMaxInCents) || 0,

          city,
          area: area || '',

          updatedAt: Date.now(),
        },
      }
    );

    await db.collection('orders').updateMany(
      {
        serviceId,
        providerEmail: req.user.email,
      },
      {
        $set: {
          serviceTitle: title,
          updatedAt: Date.now(),
        },
      }
    );

    return res.json({
      success: true,
      message: 'Serviço atualizado com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao editar serviço',
    });
  }
});

/* EXCLUIR SERVIÇO */

app.delete('/services/:id', auth, async (req, res) => {
  try {
    const serviceId = req.params.id;

    if (!ObjectId.isValid(serviceId)) {
      return res.json({
        success: false,
        message: 'Serviço inválido',
      });
    }

    const service = await db.collection('services').findOne({
      _id: new ObjectId(serviceId),
      userEmail: req.user.email,
    });

    if (!service) {
      return res.json({
        success: false,
        message: 'Serviço não encontrado ou sem permissão',
      });
    }

    await db.collection('services').deleteOne({
      _id: new ObjectId(serviceId),
      userEmail: req.user.email,
    });

    await db.collection('orders').updateMany(
      {
        serviceId,
        providerEmail: req.user.email,
      },
      {
        $set: {
          status: 'cancelado',
          updatedAt: Date.now(),
        },
      }
    );

    return res.json({
      success: true,
      message: 'Serviço excluído com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao excluir serviço',
    });
  }
});

/* LISTAR SERVIÇOS PÚBLICOS */

app.get('/services/public', async (req, res) => {
  try {
    const services = await db
      .collection('services')
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    const servicesWithOwners = await Promise.all(
      services.map(async (service) => {
        const owner = await db.collection('users').findOne({
          email: service.userEmail,
        });

        return {
          ...service,

          ownerName: service.ownerName || owner?.name || 'Prestador',

          ownerAvatar: service.ownerAvatar || owner?.avatarUrl || '',

          ownerColor: service.ownerColor || owner?.profileColor || '#ff6b6b',
        };
      })
    );

    return res.json({
      success: true,
      services: servicesWithOwners,
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao listar serviços',
    });
  }
});

/* PERFIL PÚBLICO */

/* PERFIL PÚBLICO */

app.get('/public-profile/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: 'E-mail inválido.',
      });
    }

    const usersCollection = db.collection('users');
    const servicesCollection = db.collection('services');

    const user = await usersCollection.findOne(
      { email },
      {
        projection: {
          password: 0,
          code: 0,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
      });
    }

    const userServices = await servicesCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      profile: {
        name: user.name || 'Usuário',
        email: user.email,
        profession: user.profession || 'Profissional',
        city: user.city || 'Cidade não informada',
        bio: user.bio || 'Esse usuário ainda não adicionou uma bio.',
        avatarUrl: user.avatarUrl || '',
        profileColor: user.profileColor || '#5865f2',
      },

      services: userServices.map((service) => ({
        _id: service._id,
        title: service.title,
        category: service.category,
        price: service.price,
        priceType: service.priceType,
        priceInCents: service.priceInCents,
        priceMinInCents: service.priceMinInCents,
        priceMaxInCents: service.priceMaxInCents,
        city: service.city,
        area: service.area,
        description: service.description,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar perfil público:', error);

    res.status(500).json({
      message: 'Erro ao buscar perfil público.',
    });
  }
});

/* COMPATIBILIDADE COM HOME ANTIGA */

app.get('/services', async (req, res) => {
  try {
    const services = await db
      .collection('services')
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      success: true,
      services,
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao listar serviços',
    });
  }
});

/* CONTRATAR SERVIÇO */

app.post('/order', auth, async (req, res) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.json({
        success: false,
        message: 'Serviço não informado',
      });
    }

    const service = await db.collection('services').findOne({
      _id: new ObjectId(serviceId),
    });

    if (!service) {
      return res.json({
        success: false,
        message: 'Serviço não encontrado',
      });
    }

    await db.collection('orders').insertOne({
      serviceId,
      serviceTitle: service.title,
      clientEmail: req.user.email,
      providerEmail: service.userEmail,
      status: 'pendente',
      createdAt: Date.now(),
    });

    return res.json({
      success: true,
      message: 'Pedido enviado com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao contratar serviço',
    });
  }
});

/* COMPATIBILIDADE COM FRONT ANTIGO */

app.post('/hire-service', auth, async (req, res) => {
  try {
    const { serviceId } = req.body;

    if (!serviceId) {
      return res.json({
        success: false,
        message: 'Serviço não informado',
      });
    }

    const service = await db.collection('services').findOne({
      _id: new ObjectId(serviceId),
    });

    if (!service) {
      return res.json({
        success: false,
        message: 'Serviço não encontrado',
      });
    }

    await db.collection('orders').insertOne({
      serviceId,
      serviceTitle: service.title,
      clientEmail: req.user.email,
      providerEmail: service.userEmail,
      status: 'pendente',
      createdAt: Date.now(),
    });

    return res.json({
      success: true,
      message: 'Pedido enviado com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao contratar serviço',
    });
  }
});

/* ATUALIZAR STATUS */

app.post('/order/status', auth, async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const allowed = ['pendente', 'aceito', 'concluido', 'cancelado'];

    if (!allowed.includes(status)) {
      return res.json({
        success: false,
        message: 'Status inválido',
      });
    }

    await db.collection('orders').updateOne(
      {
        _id: new ObjectId(orderId),
      },
      {
        $set: {
          status,
          updatedAt: Date.now(),
        },
      }
    );

    return res.json({
      success: true,
      message: 'Status atualizado',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao atualizar status',
    });
  }
});

/* ADMIN HELPERS */

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  return getAdminEmails().includes(String(email).toLowerCase());
}

function adminOnly(req, res, next) {
  if (!isAdminEmail(req.user.email)) {
    return res.json({
      success: false,
      message: 'Acesso negado',
    });
  }

  next();
}

/* VERIFICAR ADMIN */

app.get('/admin/check', auth, async (req, res) => {
  return res.json({
    success: true,
    isAdmin: isAdminEmail(req.user.email),
    email: req.user.email,
  });
});

/* LISTAR PERFIS DEMO */

app.get('/admin/demo-profiles', auth, adminOnly, async (req, res) => {
  try {
    const users = await db
      .collection('users')
      .find({ isDemo: true })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const profiles = await Promise.all(
      users.map(async (user) => {
        const service = await db.collection('services').findOne({
          userEmail: user.email,
          isDemo: true,
        });

        return {
          ...user,
          service: service || null,
        };
      })
    );

    return res.json({
      success: true,
      profiles,
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao listar perfis demonstrativos',
    });
  }
});

/* CRIAR / EDITAR PERFIL DEMO */

app.post('/admin/demo-profile', auth, adminOnly, async (req, res) => {
  try {
    const {
      originalEmail,
      name,
      email,
      profession,
      bio,
      city,
      rating,
      reviews,
      avatarUrl,
      profileColor,
      serviceId,
      serviceTitle,
      category,
      price,
      priceType,
      priceInCents,
      priceMinInCents,
      priceMaxInCents,
      area,
      description,
    } = req.body;

    if (
      !name ||
      !email ||
      !profession ||
      !city ||
      !serviceTitle ||
      !category ||
      !price ||
      !description
    ) {
      return res.json({
        success: false,
        message: 'Preencha os campos obrigatórios',
      });
    }

    const safeOriginalEmail = String(originalEmail || email)
      .trim()
      .toLowerCase();

    const safeEmail = String(email).trim().toLowerCase();
    const safeName = String(name).trim().slice(0, 30);
    const safeProfession = String(profession).trim().slice(0, 30);

    const finalRating = Math.min(Math.max(Number(rating) || 5, 0), 5);
    const finalReviews = Math.max(Number(reviews) || 0, 0);

    const allowedColors = [
      '#5865f2',
      '#ff6b6b',
      '#3ba55c',
      '#faa61a',
      '#a78bfa',
      '#ff7ac8',
      '#ffffff',
      '#8b5e3c',
      '#f97316',
      '#22d3ee',
      '#9ca3af',
      '#111827',
      '#facc15',
      '#10b981',
      '#6366f1',
      '#7f1d1d',
      '#84cc16',
      '#14b8a6',
      '#fb7185',
    ];

    const finalProfileColor = allowedColors.includes(profileColor)
      ? profileColor
      : '#ff6b6b';

    await db.collection('users').updateOne(
      { email: safeOriginalEmail },
      {
        $set: {
          email: safeEmail,
          name: safeName,
          profession: safeProfession,
          bio: bio || '',
          city,
          rating: finalRating,
          reviews: finalReviews,
          avatarUrl: avatarUrl || '',
          profileColor: finalProfileColor,
          role: 'demo',
          isDemo: true,
          updatedAt: Date.now(),
        },

        $setOnInsert: {
          createdAt: Date.now(),
        },
      },
      { upsert: true }
    );

    if (safeOriginalEmail !== safeEmail) {
      await db.collection('services').updateMany(
        {
          userEmail: safeOriginalEmail,
          isDemo: true,
        },
        {
          $set: {
            userEmail: safeEmail,
            ownerName: safeName,
            ownerAvatar: avatarUrl || '',
            ownerColor: finalProfileColor,
          },
        }
      );
    }

    const serviceData = {
      title: serviceTitle,
      category,
      description,

      price,
      priceType: priceType || 'fixed',

      priceInCents: Number(priceInCents) || 0,
      priceMinInCents: Number(priceMinInCents) || 0,
      priceMaxInCents: Number(priceMaxInCents) || 0,

      city,
      area: area || '',

      userEmail: safeEmail,
      ownerName: safeName,
      ownerProfession: safeProfession,
      ownerRating: finalRating,
      ownerReviews: finalReviews,
      ownerAvatar: avatarUrl || '',
      ownerColor: finalProfileColor,

      isDemo: true,
      updatedAt: Date.now(),
    };

    if (serviceId) {
      await db.collection('services').updateOne(
        {
          _id: new ObjectId(serviceId),
        },
        {
          $set: serviceData,
        }
      );
    } else {
      await db.collection('services').insertOne({
        ...serviceData,
        createdAt: Date.now(),
      });
    }

    return res.json({
      success: true,
      message: 'Perfil demonstrativo salvo com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao salvar perfil demonstrativo',
    });
  }
});

/* PERFIL DO USUÁRIO */

app.get('/profile', auth, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao carregar perfil',
    });
  }
});

app.post('/profile', auth, async (req, res) => {
  try {
    const { name, profession, city, bio, avatarUrl, profileColor } = req.body;

    if (!name) {
      return res.json({
        success: false,
        message: 'Nome obrigatório',
      });
    }

    const allowedColors = [
      '#5865f2',
      '#ff6b6b',
      '#3ba55c',
      '#faa61a',
      '#a78bfa',
      '#ff7ac8',
      '#ffffff',
      '#8b5e3c',
      '#f97316',
      '#22d3ee',
      '#9ca3af',
      '#111827',
      '#facc15',
      '#10b981',
      '#6366f1',
      '#7f1d1d',
      '#84cc16',
      '#14b8a6',
      '#fb7185',
    ];

    const finalProfileColor = allowedColors.includes(profileColor)
      ? profileColor
      : '#ff6b6b';

    const safeName = String(name).trim().slice(0, 20);
    const safeProfession = String(profession || '')
      .trim()
      .slice(0, 30);
    const safeCity = String(city || '')
      .trim()
      .slice(0, 40);
    const safeBio = String(bio || '')
      .trim()
      .slice(0, 300);

    await db.collection('users').updateOne(
      { email: req.user.email },
      {
        $set: {
          name: safeName,
          profession: safeProfession,
          city: safeCity,
          bio: safeBio,
          avatarUrl: avatarUrl || '',
          profileColor: finalProfileColor,
          updatedAt: Date.now(),
        },
      }
    );

    await db.collection('services').updateMany(
      { userEmail: req.user.email },
      {
        $set: {
          ownerName: safeName,
          ownerProfession: safeProfession,
          ownerAvatar: avatarUrl || '',
          ownerColor: finalProfileColor,
        },
      }
    );

    return res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
    });
  } catch (err) {
    console.error(err);

    return res.json({
      success: false,
      message: 'Erro ao salvar perfil',
    });
  }
});

/* SERVER (nao recomendo usar com live server do python) */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
