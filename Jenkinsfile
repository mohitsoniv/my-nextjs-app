pipeline {
    agent any

    tools {
        nodejs 'node18' // Ensure this version is installed via Jenkins plugin
    }

    environment {
        EC2_HOST = 'ec2-user@34.201.241.85'
        SSH_KEY_ID = 'ec2-ssh-key'     // Jenkins SSH credentials ID
        APP_DIR = 'my-nextjs-app'
        DEPLOY_DIR = '/home/ec2-user/app'
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
                    echo "🧹 Cleaning previous node_modules and cache"
                    rm -rf node_modules package-lock.json
                    npm cache clean --force

                    echo "📦 Installing dependencies"
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('Build App') {
            steps {
                sh '''
                    echo "🏗️ Building the Next.js app"
                    npm run build
                '''
            }
        }

        stage('Package Standalone Build') {
            steps {
                sh '''
                    mkdir -p packaged-app
                    cp -r .next standalone public next.config.ts package.json packaged-app/
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent (credentials: [env.SSH_KEY_ID]) {
                    sh """
                        echo "🚀 Deploying to EC2: ${EC2_HOST}"
                        ssh -o StrictHostKeyChecking=no ${EC2_HOST} 'mkdir -p ${DEPLOY_DIR}'
                        scp -o StrictHostKeyChecking=no -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}
                        ssh -o StrictHostKeyChecking=no ${EC2_HOST} '
                            cd ${DEPLOY_DIR} &&
                            npm install --omit=dev &&
                            pm2 delete all || true &&
                            pm2 start server.js --name nextjs-app || npm run start
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build and deployment successful!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
