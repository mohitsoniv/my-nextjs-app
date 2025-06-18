pipeline {
    agent any

    tools {
        nodejs 'node18' // Must match the name in Jenkins Global Tool Configuration
    }

    environment {
        EC2_HOST = 'ec2-user@52.201.217.125'
        SSH_KEY_ID = 'ec2-ssh-key'     // Jenkins SSH credentials ID
        DEPLOY_DIR = '/var/www/myapp'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git 'https://github.com/mohitsoniv/my-nextjs-app.git'
            }
        }

        stage('Verify Node & NPM') {
            steps {
                sh '''
                    echo "🔧 Verifying Node.js and npm"
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "🧹 Cleaning previous node_modules and cache"
                    rm -rf node_modules package-lock.json || true
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
                    cp -r .next/standalone public next.config.* package.json packaged-app/
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "🚀 Deploying to EC2 (${EC2_HOST})"
                        scp -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}

                        echo "🔄 Restarting app on EC2"
                        ssh ${EC2_HOST} '
                            cd ${DEPLOY_DIR} &&
                            pm2 restart myapp || pm2 start npm --name myapp -- start
                        '
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
