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

        stage('Build Docker Images') {
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

        stage('Verify Deployment') {
            steps {
                sh '''
                    docker compose ps

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
