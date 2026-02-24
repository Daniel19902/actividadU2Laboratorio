// =============================================================
// Jenkinsfile — actividadU2Laboratorio
// Pipeline declarativo: CI (lint → test) + CD (build → push → deploy)
// Compatible con Jenkins 2.x+ y el plugin Docker Pipeline
// =============================================================

pipeline {
    // Agente con soporte Docker (requiere Docker instalado en el nodo)
    agent {
        docker {
            image 'node:20-alpine'
            // Monta el socket de Docker para poder hacer builds dentro del agente
            args  '-v /var/run/docker.sock:/var/run/docker.sock -u root'
        }
    }

    // ── Variables de entorno globales ────────────────────────────
    environment {
        // Nombre de la imagen Docker a construir
        IMAGE_NAME    = 'actividadu2lab'
        // Registry de destino — cambiar por tu registry real
        REGISTRY      = 'ghcr.io'
        // Repositorio GitHub (owner/repo)
        REPO          = 'tu-usuario/actividadU2Laboratorio'
        // Tag de imagen: rama + commit corto
        IMAGE_TAG     = "${IMAGE_NAME}:${GIT_BRANCH.replaceAll('/', '-')}-${GIT_COMMIT.take(7)}"
        FULL_IMAGE    = "${REGISTRY}/${REPO}/${IMAGE_NAME}:${GIT_BRANCH.replaceAll('/', '-')}-${GIT_COMMIT.take(7)}"
        // Credenciales almacenadas en Jenkins → Manage Credentials
        // ID del secret de registry (usuario + token)
        REGISTRY_CRED = 'ghcr-credentials'
        // ID del secret SSH para el servidor de despliegue (si aplica)
        DEPLOY_CRED   = 'deploy-ssh-key'
    }

    // ── Opciones del pipeline ────────────────────────────────────
    options {
        // Tiempo máximo total del pipeline
        timeout(time: 30, unit: 'MINUTES')
        // Conservar solo los últimos 10 builds en la UI
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // No permitir ejecuciones concurrentes del mismo job
        disableConcurrentBuilds()
        // Marca timestamps en el log de consola
        timestamps()
        // Colorear la salida ANSI en el log
        ansiColor('xterm')
    }

    // ── Stages ───────────────────────────────────────────────────
    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────
        stage('📥 Checkout') {
            steps {
                echo "🔖 Rama: ${env.GIT_BRANCH} | Commit: ${env.GIT_COMMIT.take(7)}"
                checkout scm
            }
        }

        // ── Stage 2: Instalar dependencias ────────────────────────
        stage('📦 Install') {
            steps {
                echo '🔧 Instalando dependencias con npm ci...'
                sh 'npm ci'
            }
        }

        // ── Stage 3: Lint ─────────────────────────────────────────
        stage('🔍 Lint') {
            steps {
                echo '🔍 Ejecutando ESLint...'
                sh 'npm run lint'
            }
        }

        // ── Stage 4: Tests ────────────────────────────────────────
        stage('🧪 Test') {
            steps {
                echo '🧪 Ejecutando tests con cobertura...'
                sh 'npm test'
            }
            post {
                always {
                    // Publicar reporte de cobertura en Jenkins
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Cobertura de Tests'
                    ])
                }
            }
        }

        // ── Stage 5: Build Docker Image ────────────────────────────
        stage('🐳 Build Image') {
            steps {
                echo "🐳 Construyendo imagen: ${env.FULL_IMAGE}"
                sh """
                    docker build \
                        --target production \
                        -t ${env.IMAGE_TAG} \
                        -t ${env.FULL_IMAGE} \
                        .
                """
            }
        }

        // ── Stage 6: Push Docker Image ─────────────────────────────
        // Solo se ejecuta en la rama main
        stage('📤 Push Image') {
            when {
                branch 'main'
            }
            steps {
                echo "📤 Subiendo imagen al registry: ${env.REGISTRY}"
                withCredentials([usernamePassword(
                    credentialsId: env.REGISTRY_CRED,
                    usernameVariable: 'REG_USER',
                    passwordVariable: 'REG_PASS'
                )]) {
                    sh """
                        echo \$REG_PASS | docker login ${env.REGISTRY} -u \$REG_USER --password-stdin
                        docker push ${env.FULL_IMAGE}
                        docker logout ${env.REGISTRY}
                    """
                }
            }
        }

        // ── Stage 7: Deploy ────────────────────────────────────────
        // Solo se ejecuta en la rama main
        stage('🚀 Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo "🚀 Iniciando despliegue de ${env.FULL_IMAGE}..."

                // ─ Opción A: Deploy por SSH (Docker en VPS) ──────────
                // Descomenta y configura DEPLOY_HOST si usas SSH:
                //
                // withCredentials([sshUserPrivateKey(
                //     credentialsId: env.DEPLOY_CRED,
                //     keyFileVariable: 'SSH_KEY',
                //     usernameVariable: 'SSH_USER'
                // )]) {
                //     sh """
                //         ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@\${DEPLOY_HOST} '
                //             docker pull ${env.FULL_IMAGE}
                //             docker stop actividadu2lab-app || true
                //             docker rm actividadu2lab-app || true
                //             docker run -d \\
                //                 --name actividadu2lab-app \\
                //                 --restart unless-stopped \\
                //                 -p 3000:3000 \\
                //                 -e NODE_ENV=production \\
                //                 ${env.FULL_IMAGE}
                //         '
                //     """
                // }

                // ─ Opción B: Deploy en Kubernetes ────────────────────
                // Descomenta si usas kubectl:
                //
                // withKubeConfig([credentialsId: 'kube-config']) {
                //     sh """
                //         kubectl set image deployment/actividadu2lab \
                //             app=${env.FULL_IMAGE}
                //         kubectl rollout status deployment/actividadu2lab
                //     """
                // }

                // ─ Opción C (ACTIVA): Deploy genérico / simulación ────
                sh """
                    echo "✅ Deploy simulado para: ${env.FULL_IMAGE}"
                    echo "Activa la Opción A (SSH) o B (Kubernetes) según tu infraestructura."
                """
            }
        }
    }

    // ── Post-pipeline ─────────────────────────────────────────────
    post {
        success {
            echo """
            ╔══════════════════════════════════════╗
            ║  ✅ Pipeline completado exitosamente  ║
            ║  Imagen: ${env.FULL_IMAGE}
            ╚══════════════════════════════════════╝
            """
        }
        failure {
            echo '❌ Pipeline falló. Revisar los logs de los stages.'
        }
        always {
            echo "🧹 Limpiando imágenes Docker locales..."
            sh "docker rmi ${env.IMAGE_TAG} || true"
            sh "docker rmi ${env.FULL_IMAGE} || true"
            cleanWs()
        }
    }
}
