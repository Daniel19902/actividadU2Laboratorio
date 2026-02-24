# actividadU2Laboratorio

[![CI Pipeline](https://github.com/TU_USUARIO/actividadU2Laboratorio/actions/workflows/ci.yml/badge.svg)](https://github.com/TU_USUARIO/actividadU2Laboratorio/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/TU_USUARIO/actividadU2Laboratorio/actions/workflows/cd.yml/badge.svg)](https://github.com/TU_USUARIO/actividadU2Laboratorio/actions/workflows/cd.yml)

Aplicación web **Node.js / Express** con pipelines **CI/CD** completos usando **GitHub Actions** y **Jenkins**.

---

## 📁 Estructura del proyecto

```
actividadU2Laboratorio/
├── src/
│   ├── app.js               ← Aplicación Express (exportable para tests)
│   └── index.js             ← Punto de entrada del servidor
├── tests/
│   └── app.test.js          ← Tests unitarios (Jest + Supertest)
├── .github/
│   └── workflows/
│       ├── ci.yml           ← GitHub Actions — CI Pipeline
│       └── cd.yml           ← GitHub Actions — CD Pipeline
├── jenkins/
│   ├── Dockerfile.jenkins   ← Imagen Jenkins con Docker + Node
│   ├── docker-compose.jenkins.yml ← Stack Jenkins local
│   └── plugins.txt          ← Plugins preinstalados
├── Jenkinsfile              ← Pipeline declarativo Jenkins
├── Dockerfile               ← Imagen Docker multi-stage de la app
├── docker-compose.yml       ← Compose para desarrollo local
├── .eslintrc.json           ← Configuración ESLint
└── package.json             ← Scripts npm
```

---

## 🚀 Desarrollo local

### Prerrequisitos
- Node.js 18+
- Docker & Docker Compose

### Correr la app localmente (Node)
```bash
npm install
npm start
# → http://localhost:3000
```

### Correr tests y lint
```bash
npm test          # Tests con cobertura
npm run lint      # Análisis estático con ESLint
```

### Correr con Docker Compose
```bash
docker compose up --build
# → http://localhost:3000
```

### Endpoints disponibles

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/` | GET | Mensaje de bienvenida + versión |
| `/health` | GET | Health-check (`{ "status": "ok" }`) |
| `/info` | GET | Versión de Node + uptime + entorno |

---

## ⚙️ CI/CD con GitHub Actions

### CI Pipeline (`.github/workflows/ci.yml`)

**Disparador:** `push` y `pull_request` a `main` / `develop`

```
Checkout → 🔍 Lint → 🧪 Test (+ reporte cobertura) → 🐳 Build Docker
```

| Stage | Herramienta | Descripción |
|-------|-------------|-------------|
| **Lint** | ESLint | Análisis estático del código fuente |
| **Test** | Jest + Supertest | Tests unitarios con reporte de cobertura |
| **Build** | Docker Buildx | Verifica que el Dockerfile compile correctamente |

### CD Pipeline (`.github/workflows/cd.yml`)

**Disparador:** `push` a `main` (o ejecución manual `workflow_dispatch`)

```
🐳 Build & Push (GHCR) → 🚀 Deploy (SSH / Kubernetes / genérico)
```

#### Secrets requeridos en GitHub

> Settings → Secrets and variables → Actions

| Secret | Descripción |
|--------|-------------|
| `GITHUB_TOKEN` | Automático — permite push a GHCR |
| `DEPLOY_HOST` | (Opcional) IP/hostname del servidor de despliegue |
| `DEPLOY_USER` | (Opcional) Usuario SSH del servidor |
| `DEPLOY_KEY` | (Opcional) Clave privada SSH |

---

## 🔧 CI/CD con Jenkins

### Pipeline declarativo (`Jenkinsfile`)

**Stages:**

```
📥 Checkout → 📦 Install → 🔍 Lint → 🧪 Test → 🐳 Build → 📤 Push* → 🚀 Deploy*
```
> \* Push y Deploy solo se ejecutan en la rama `main`

#### Opciones de despliegue (comentadas en el `Jenkinsfile`)

| Opción | Descripción | Credenciales necesarias |
|--------|-------------|------------------------|
| **A — SSH** | Docker en VPS remoto | `deploy-ssh-key` |
| **B — Kubernetes** | `kubectl set image` | `kube-config` |
| **C — Genérico** | Simulación (activa por defecto) | — |

### Levantar Jenkins localmente

```bash
cd jenkins/
docker compose -f docker-compose.jenkins.yml up -d
```

Abrir http://localhost:8080 y completar el wizard de configuración inicial.

#### Credenciales a configurar en Jenkins

> Manage Jenkins → Manage Credentials → Global

| ID de credencial | Tipo | Descripción |
|-----------------|------|-------------|
| `ghcr-credentials` | Username + Password | Usuario GitHub + token con `write:packages` |
| `deploy-ssh-key` | SSH Private Key | Clave para deploy por SSH (Opción A) |
| `kube-config` | Secret File | Kubeconfig codificado en Base64 (Opción B) |

#### Crear el pipeline en Jenkins

1. **New Item** → Pipeline → nombre: `actividadU2Laboratorio`
2. **Pipeline** → Definition: `Pipeline script from SCM`
3. SCM: `Git` → Repository URL: `https://github.com/TU_USUARIO/actividadU2Laboratorio.git`
4. Branch: `*/main`
5. Script Path: `Jenkinsfile`
6. Guardar → **Build Now**

---

## 🐳 Imagen Docker

La imagen usa **multi-stage build**:

| Stage | Propósito |
|-------|-----------|
| `deps` | Instala solo dependencias de producción |
| `build` | Corre lint + tests (falla el build si algo falla) |
| `production` | Imagen final mínima (Alpine), usuario no-root |

```bash
# Construir localmente
docker build -t actividadu2lab:local .

# Verificar health-check
docker run -d -p 3000:3000 --name app actividadu2lab:local
curl http://localhost:3000/health
# → {"status":"ok"}
docker rm -f app
```

---

## 📊 Flujo CI/CD completo

```
Push a GitHub
     │
     ▼
┌─────────────────────────────────┐
│   GitHub Actions — CI Pipeline  │
│  Lint → Test → Build Docker     │
└────────────┬────────────────────┘
             │ (solo rama main)
             ▼
┌─────────────────────────────────┐
│   GitHub Actions — CD Pipeline  │
│  Build & Push GHCR → Deploy     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│   Jenkins (alternativo/local)   │
│  Checkout → Install → Lint      │
│  → Test → Build → Push → Deploy │
└─────────────────────────────────┘
```

---

## 📄 Licencia

MIT — Ver [LICENSE](LICENSE)