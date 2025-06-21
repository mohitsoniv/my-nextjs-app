pipeline {
    agent any

    tools {
        nodejs 'node18' // Make sure this matches your Jenkins global tool configuration
    }

    environment {
        EC2_USER = 'ubuntu'
        EC2_IP = '3.86.102.166'
        EC2_HOST = "${EC2_USER}@${EC2_IP}"
        SSH_KEY_ID = 'ec2-ssh-key' // Jenkins credentials ID for the EC2 private key
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
                    which node
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "🧹 Cleaning previous installs"
                    rm -rf node_modules package-lock.json || true
                    npm cache clean --force || true
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
                    cp -r .next/standalone packaged-app/
                    cp -r public packaged-app/ || true
                    cp next.config.* package.json packaged-app/ || true
                '''
            }
        }

        stage('Add EC2 to known_hosts') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "🔐 Adding EC2 to known_hosts"
                        mkdir -p ~/.ssh
                        ssh-keyscan -H ${EC2_IP} >> ~/.ssh/known_hosts
                        chmod 700 ~/.ssh
                        chmod 644 ~/.ssh/known_hosts
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ["${SSH_KEY_ID}"]) {
                    sh '''
                        echo "🚀 Connecting to EC2: ${EC2_HOST}"
                        ssh -o StrictHostKeyChecking=no ${EC2_HOST} "sudo mkdir -p ${DEPLOY_DIR} && sudo chown -R ${EC2_USER}:${EC2_USER} ${DEPLOY_DIR}"

                        echo "📤 Transferring build to EC2"
                        scp -o StrictHostKeyChecking=no -r packaged-app/* ${EC2_HOST}:${DEPLOY_DIR}
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
            echo '❌ Deployment failed. Please review the logs above.'
        }
    }
}
