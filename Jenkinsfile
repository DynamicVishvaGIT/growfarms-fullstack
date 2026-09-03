pipeline {

    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/DynamicVishvaGIT/growfarms-fullstack.git'
                    ]]
                ])
            }
        }

        stage('Build') {
            steps {
                sh '''
                    docker compose build
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker compose down || true
                    docker compose up -d
                '''
            }
        }

        stage('Verify') {
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
            echo 'GrowFarms deployment completed successfully.'
        }

        failure {
            echo 'GrowFarms deployment failed.'
        }
    }
}
