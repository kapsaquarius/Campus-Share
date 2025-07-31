#!/usr/bin/env node
/**
 * Frontend Tests for CampusShare
 * Tests UI functionality and user interactions
 */

const puppeteer = require('puppeteer');

class FrontendTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async logTest(testName, success, message = '') {
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}: ${message}`);
        this.testResults.push({
            test: testName,
            success,
            message
        });
    }

    async init() {
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                slowMo: 100,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();
            await this.page.setViewport({ width: 1280, height: 720 });
            return true;
        } catch (error) {
            console.error('Failed to initialize browser:', error);
            return false;
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async testHomePage() {
        try {
            await this.page.goto('http://localhost:3000');
            await this.page.waitForSelector('h1', { timeout: 5000 });
            
            const title = await this.page.$eval('h1', el => el.textContent);
            if (title.includes('CampusShare')) {
                await this.logTest('Home Page Load', true, 'Home page loaded successfully');
                return true;
            } else {
                await this.logTest('Home Page Load', false, 'Home page title not found');
                return false;
            }
        } catch (error) {
            await this.logTest('Home Page Load', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testNavigation() {
        try {
            // Test navigation to rides page
            await this.page.click('a[href="/rides"]');
            await this.page.waitForSelector('h1', { timeout: 5000 });
            
            const ridesTitle = await this.page.$eval('h1', el => el.textContent);
            if (ridesTitle.includes('Find Rides')) {
                await this.logTest('Navigation - Rides', true, 'Successfully navigated to rides page');
            } else {
                await this.logTest('Navigation - Rides', false, 'Rides page title not found');
            }

            // Test navigation to roommates page
            await this.page.click('a[href="/roommates"]');
            await this.page.waitForSelector('h1', { timeout: 5000 });
            
            const roommatesTitle = await this.page.$eval('h1', el => el.textContent);
            if (roommatesTitle.includes('Find Roommates')) {
                await this.logTest('Navigation - Roommates', true, 'Successfully navigated to roommates page');
            } else {
                await this.logTest('Navigation - Roommates', false, 'Roommates page title not found');
            }

            // Test navigation to subleases page
            await this.page.click('a[href="/subleases"]');
            await this.page.waitForSelector('h1', { timeout: 5000 });
            
            const subleasesTitle = await this.page.$eval('h1', el => el.textContent);
            if (subleasesTitle.includes('Find Subleases')) {
                await this.logTest('Navigation - Subleases', true, 'Successfully navigated to subleases page');
            } else {
                await this.logTest('Navigation - Subleases', false, 'Subleases page title not found');
            }

            return true;
        } catch (error) {
            await this.logTest('Navigation', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testLoginPage() {
        try {
            await this.page.goto('http://localhost:3000/auth/login');
            await this.page.waitForSelector('form', { timeout: 5000 });

            // Test form validation
            await this.page.click('button[type="submit"]');
            
            // Check if validation errors appear
            const errors = await this.page.$$('.text-red-500');
            if (errors.length > 0) {
                await this.logTest('Login Form Validation', true, 'Form validation working correctly');
            } else {
                await this.logTest('Login Form Validation', false, 'No validation errors found');
            }

            // Test login with valid credentials
            await this.page.type('input[name="username"]', 'testuser');
            await this.page.type('input[name="password"]', 'password123');
            await this.page.click('button[type="submit"]');

            // Wait for either success or error
            try {
                await this.page.waitForSelector('.toast', { timeout: 5000 });
                await this.logTest('Login Form Submission', true, 'Login form submitted successfully');
            } catch (error) {
                await this.logTest('Login Form Submission', false, 'No toast notification found');
            }

            return true;
        } catch (error) {
            await this.logTest('Login Page', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testRegisterPage() {
        try {
            await this.page.goto('http://localhost:3000/auth/register');
            await this.page.waitForSelector('form', { timeout: 5000 });

            // Test form validation
            await this.page.click('button[type="submit"]');
            
            // Check if validation errors appear
            const errors = await this.page.$$('.text-red-500');
            if (errors.length > 0) {
                await this.logTest('Register Form Validation', true, 'Form validation working correctly');
            } else {
                await this.logTest('Register Form Validation', false, 'No validation errors found');
            }

            // Test form completion
            await this.page.type('input[placeholder*="username"]', 'newuser123');
            await this.page.type('input[placeholder*="email"]', 'newuser@example.com');
            await this.page.type('input[placeholder*="name"]', 'New User');
            await this.page.type('input[placeholder*="password"]', 'Password123');
            await this.page.type('input[placeholder*="confirm"]', 'Password123');
            
            // Check if checkbox is available and click it
            const checkbox = await this.page.$('input[type="checkbox"]');
            if (checkbox) {
                await checkbox.click();
            }

            // Check if submit button is enabled
            const submitButton = await this.page.$('button[type="submit"]');
            const isDisabled = await submitButton.evaluate(button => button.disabled);
            
            if (!isDisabled) {
                await this.logTest('Register Form Completion', true, 'Submit button enabled when form is complete');
            } else {
                await this.logTest('Register Form Completion', false, 'Submit button still disabled');
            }

            return true;
        } catch (error) {
            await this.logTest('Register Page', false, `Error: ${error.message}`);
            return false;
        }
    }

    async testAPIConnection() {
        try {
            await this.page.goto('http://localhost:3000/test-api');
            await this.page.waitForSelector('button', { timeout: 5000 });

            // Test health check
            await this.page.click('button:contains("Test Health Check")');
            await this.page.waitForTimeout(2000);

            // Check if results are displayed
            const results = await this.page.$eval('pre', el => el.textContent);
            if (results && results.includes('health')) {
                await this.logTest('API Connection Test', true, 'API connection working');
            } else {
                await this.logTest('API Connection Test', false, 'No API results found');
            }

            return true;
        } catch (error) {
            await this.logTest('API Connection Test', false, `Error: ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        console.log('🧪 Starting CampusShare Frontend Tests');
        console.log('=' * 50);

        const tests = [
            this.testHomePage,
            this.testNavigation,
            this.testLoginPage,
            this.testRegisterPage,
            this.testAPIConnection
        ];

        for (const test of tests) {
            await test.call(this);
            await this.page.waitForTimeout(1000);
        }

        // Summary
        console.log('\n' + '=' * 50);
        console.log('📊 Test Summary');
        console.log('=' * 50);

        const passed = this.testResults.filter(result => result.success).length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

        if (passed === total) {
            console.log('\n🎉 All frontend tests passed!');
        } else {
            console.log('\n⚠️ Some frontend tests failed. Please check the errors above.');
        }

        return passed === total;
    }
}

async function main() {
    const tester = new FrontendTester();
    
    try {
        const initialized = await tester.init();
        if (!initialized) {
            console.error('Failed to initialize browser');
            return 1;
        }

        const success = await tester.runAllTests();
        return success ? 0 : 1;
    } catch (error) {
        console.error('Test execution failed:', error);
        return 1;
    } finally {
        await tester.cleanup();
    }
}

if (require.main === module) {
    main().then(exitCode => process.exit(exitCode));
}

module.exports = FrontendTester; 