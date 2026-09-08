pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/DynamicVishvaGIT/growfarms-fullstack.git',
                        credentialsId: 'github-token'
                    ]]
                ])
            }
        }

        stage('Verify Source') {
            steps {
                sh '''
                    echo "===== COMMIT ====="
                    git log -1 --format="%H%n%ad%n%s" --date=iso

                    echo "===== PROJECT ====="
                    pwd
                    ls -la

                    echo "===== BACKEND ====="
                    ls -la backend

                    echo "===== FRONTEND ====="
                    ls -la src

                    echo "===== ADMIN ====="
                    ls -la admin/src/pages
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker compose build
                '''
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh '''
                    docker compose down || true
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker compose up -d
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    docker compose ps

                    # The admin panel is a separate Vite build copied into the
                    # image at /usr/share/nginx/html/admin. If that build ever
                    # silently drops out of Dockerfile.frontend again, the site
                    # still comes up green — so assert it landed.
                    echo "===== ADMIN BUNDLE ====="
                    docker exec growfarms-frontend ls /usr/share/nginx/html/admin

                    echo "===== BACKEND LOGS ====="
                    docker logs --tail 50 growfarms-backend || true

                    echo "===== FRONTEND LOGS ====="
                    docker logs --tail 50 growfarms-frontend || true
                '''
            }
        }
    }

    post {
        success {
            echo 'GrowFarms deployment successful.'
        }

        failure {
            echo 'GrowFarms deployment failed.'
        }
    }
}
