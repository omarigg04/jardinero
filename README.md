# 🌱 Jardinero Virtual

Un juego de simulación de jardinería en tiempo real donde cultivas plantas que crecen usando la hora y fecha reales, incluso cuando no estás en línea.

## 🎮 Características del Juego

- **🌱 Cultivo en Tiempo Real**: Las plantas crecen basándose en tiempo real
- **🌾 Terreno 2x4**: 8 parcelas para cultivar tus plantas
- **🌰 4 Tipos de Semillas**: Tomate, Zanahoria, Lechuga y Calabaza
- **💰 Sistema Económico**: Compra semillas, vende frutos y genera ganancias
- **⭐ Sistema de Experiencia**: Gana XP cosechando plantas
- **📱 Interfaz Responsive**: Funciona en desktop y móvil

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express.js
- **MySQL** para persistencia de datos
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas

### Frontend
- **React** con Hooks
- **Axios** para comunicación con API
- **CSS3** con animaciones y responsive design

## 📦 Instalación y Configuración

### Prerrequisitos

- Node.js (v14 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd plant-app
```

### 2. Configurar la Base de Datos

1. Crear una base de datos MySQL:
```sql
CREATE DATABASE jardinero_virtual;
```

2. Importar la estructura de la base de datos:
```bash
mysql -u root -p jardinero_virtual < database_structure.sql
```

### 3. Configurar Variables de Entorno

1. Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Editar `.env` con tus configuraciones:
```env
# Configuración de la base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jardinero_virtual
DB_USER=root
DB_PASSWORD=tu_password_mysql

# JWT Secret para autenticación
JWT_SECRET=tu-super-secreto-jwt-aqui

# Puerto del servidor
PORT=3000

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:3001
```

### 4. Instalar Dependencias

#### Backend:
```bash
npm install
```

#### Frontend:
```bash
cd client
npm install
cd ..
```

O instalar todo de una vez:
```bash
npm run install-all
```

### 5. Ejecutar la Aplicación

#### Modo Desarrollo:

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

#### Modo Producción:
```bash
npm run build
npm start
```

### 6. Acceder a la Aplicación

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

## 🎯 Cómo Jugar

### 1. Registro/Login
- Crea una cuenta nueva o inicia sesión
- Recibes dinero inicial y 2 semillas de cada tipo

### 2. Plantar Semillas
- Ve a \"Mi Jardín\"
- Selecciona una semilla del inventario
- Haz clic en una parcela vacía para plantar

### 3. Crecimiento de Plantas
- Las plantas crecen en tiempo real según sus tiempos de crecimiento:
  - 🥬 Lechuga: 12 horas
  - 🍅 Tomate: 24 horas  
  - 🥕 Zanahoria: 48 horas
  - 🎃 Calabaza: 72 horas

### 4. Cosechar
- Cuando una planta esté lista (100%), haz clic para cosechar
- Recibes: XP + 2 semillas nuevas + 1 fruto

### 5. Economía
- Ve a la \"Tienda\" para:
  - Comprar más semillas
  - Vender semillas excedentes (bajo precio)
  - Vender frutos (alto precio)

## 🗄️ Estructura de la Base de Datos

### Tablas Principales:

- **users**: Información de jugadores (dinero, XP, nivel)
- **seed_types**: Tipos de semillas disponibles
- **user_inventory**: Inventario de semillas por usuario
- **user_fruits**: Inventario de frutos por usuario
- **user_plots**: Estado del terreno (2x4 parcelas)
- **transactions**: Historial de compras/ventas

### Procedimientos y Funciones:

- **InitializeNewUser()**: Configura un nuevo jugador
- **GetPlantGrowthProgress()**: Calcula progreso de crecimiento
- **HarvestPlant()**: Procesa la cosecha de plantas

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Ejecutar backend en modo desarrollo
npm start               # Ejecutar backend en producción

# Instalación
npm run install-all     # Instalar dependencias de backend y frontend

# Frontend
cd client && npm start  # Ejecutar frontend en desarrollo
cd client && npm run build  # Build de producción del frontend
```

## 🎨 Características Técnicas

### Sistema de Crecimiento en Tiempo Real
- Usa `Date.now()` y timestamps de MySQL
- Calcula progreso basado en tiempo transcurrido
- Actualización automática cada 30 segundos

### Seguridad
- Autenticación JWT
- Hash de contraseñas con bcrypt
- Validación de datos en backend
- Protección CORS configurada

### Responsive Design
- CSS Grid para el terreno de cultivo
- Flexbox para layouts
- Media queries para móvil
- Animaciones CSS suaves

## 🐛 Resolución de Problemas

### Error de Conexión a MySQL
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en `.env`
3. Verificar que la base de datos existe

### Error \"JWT Secret\"
1. Asegurar que `JWT_SECRET` esté configurado en `.env`
2. Reiniciar el servidor backend

### Puerto en Uso
1. Cambiar `PORT` en `.env`
2. Actualizar `FRONTEND_URL` si es necesario

## 🔄 Próximas Funcionalidades

- [ ] Sistema de niveles más avanzado
- [ ] Más tipos de plantas
- [ ] Clima que afecte el crecimiento
- [ ] Logros y badges
- [ ] Modo multijugador
- [ ] Mercado entre jugadores

## 📄 Licencia

MIT License - puedes usar este código libremente para tus proyectos.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

¡Disfruta cultivando tu jardín virtual! 🌱🎮