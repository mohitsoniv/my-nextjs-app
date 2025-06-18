pipeline {
    agent any

    tools {
        nodejs 'node18' // Make sure Node.js 18 is installed in Jenkins
    }

    environment {
        EC2_HOST = 'ec2-user@34.201.241.85'
        SSH_KEY_ID = 'ec2-ssh-key' // Replace with your actual Jenkins credentials ID
        DEPLOY_DIR = '/var/www/myapp'
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

                        echo "🔐 Trusting EC2 host..."
                        ssh-keyscan -H 34.201.241.85 >> ~/.ssh/known_hosts

                        echo "📦 Copying files to EC2..."
                        scp -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}

                        echo "🔁 Restarting app with PM2..."
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
