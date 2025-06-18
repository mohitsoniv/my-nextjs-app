pipeline {
    agent any

    tools {
        nodejs 'node18' // Ensure this version is installed via NodeJS plugin
    }

    environment {
        EC2_HOST = 'ec2-user@52.201.217.125'
        SSH_KEY_ID = 'ec2-ssh-key'     // Jenkins SSH credentials ID
        APP_DIR = 'my-nextjs-app'
        DEPLOY_DIR = '/var/www/myapp' // assuming this is the correct directory
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
                    echo "📦 Packaging standalone build"
                    mkdir -p packaged-app
                    cp -r .next/standalone public next.config.ts package.json packaged-app/
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "🚀 Deploying app to EC2..."
                        scp -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}
                        ssh ${EC2_HOST} 'pm2 restart myapp || pm2 start npm --name myapp -- start'
                    '''
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
