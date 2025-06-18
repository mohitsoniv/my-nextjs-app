pipeline {
    agent any

    tools {
        nodejs 'node18' // Make sure this is configured in Jenkins
    }

    environment {
        EC2_HOST = 'ec2-user@34.201.241.85'
        SSH_KEY_ID = 'ec2-ssh-key'           // Must match your Jenkins credentials ID
        BUILD_DIR = 'out'
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/mohitsoniv/my-nextjs-app.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "🧹 Cleaning up old node_modules and cache"
                    rm -rf node_modules package-lock.json
                    npm cache clean --force

                    echo "📦 Installing dependencies"
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                sh 'npm run export' // Exports static files into `out/`
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent (credentials: [env.SSH_KEY_ID]) {
                    sh """
                        scp -o StrictHostKeyChecking=no -r ${env.BUILD_DIR} ${env.EC2_HOST}:/home/ec2-user/
                        ssh -o StrictHostKeyChecking=no ${env.EC2_HOST} '
                            sudo rm -rf /var/www/html/*
                            sudo cp -r /home/ec2-user/${env.BUILD_DIR}/* /var/www/html/
                            sudo nginx -t && sudo systemctl reload nginx
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '🚀 Deployed Successfully!'
        }
        failure {
            echo '❌ Deployment Failed!'
        }
    }
}
