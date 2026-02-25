pipeline {
    // Agente que ejecuta en el propio contenedor Jenkins
    // (el contenedor ya tiene Docker CLI y Node 20 instalados)
    agent any
    environment {
        // Nombre de la imagen Docker a construir
        // Registry de destino — Docker Hub
        REGISTRY      = 'docker.io'
        // Repositorio Docker Hub (DOCKERHUB_USERNAME/repo)
        REPO          = 'darkeater/actividadu2laboratorio'
        // Tag de imagen: rama + commit corto
        IMAGE_TAG     = "${IMAGE_NAME}:${GIT_BRANCH.replaceAll('/', '-')}-${GIT_COMMIT.take(7)}"
        FULL_IMAGE    = "${REPO}:${GIT_BRANCH.replaceAll('/', '-')}-${GIT_COMMIT.take(7)}"
        // Credenciales almacenadas en Jenkins → Manage Credentials
        // ID de la credencial de Docker Hub (Username + Access Token/Password)
        REGISTRY_CRED = 'dockerhub-credentials'
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
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "${env.GIT_BRANCH ?: 'main'}"]],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Daniel19902/actividadU2Laboratorio.git',
                        // ID de la credencial configurada en Jenkins → Manage Credentials
                        credentialsId: 'github-credentials'
                    ]]
                ])
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
        stage('📤 Push Image') {
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
        stage('🚀 Deploy') {
            steps {
                echo "🚀 Iniciando despliegue de ${env.FULL_IMAGE}..."                
                withKubeConfig([credentialsId: 'kube-config']) {
                    sh """
                        # Aplica manifests (crea o actualiza Deployment + Service)
                        kubectl apply -f k8s/deployment.yaml
                        kubectl apply -f k8s/service.yaml

                        # Actualiza la imagen del contenedor con la nueva versión
                        kubectl set image deployment/actividadu2lab \
                            app=${env.FULL_IMAGE}

                        # Espera a que el rolling update termine
                        kubectl rollout status deployment/actividadu2lab --timeout=120s

                        # Muestra el estado de los pods desplegados
                        kubectl get pods -l app=actividadu2lab
                        kubectl get svc actividadu2lab-svc
                    """
                }
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
