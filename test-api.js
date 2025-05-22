import fetch from 'node-fetch';
import readline from 'readline';

// API URL
const API_URL = 'http://localhost:7000/api';

// User credentials
const admin = {
    username: 'Hdmin',
    password: 'Hdmin1738!@'
};

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to ask questions
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Store cookies between requests
let cookies = [];

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Add cookies to request if available
    if (cookies.length > 0) {
        options.headers = {
            ...options.headers,
            'Cookie': cookies.join('; ')
        };
    }
    
    try {
        const response = await fetch(url, options);
        
        // Save cookies for subsequent requests
        const setCookieHeader = response.headers.raw()['set-cookie'];
        if (setCookieHeader) {
            cookies = setCookieHeader;
        }
        
        if (response.status >= 400) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                return { success: false, status: response.status, error: errorJson };
            } catch {
                return { success: false, status: response.status, error: errorText };
            }
        }
        
        if (response.headers.get('content-type')?.includes('application/json')) {
            const data = await response.json();
            return { success: true, status: response.status, data };
        } else {
            const text = await response.text();
            return { success: true, status: response.status, data: text };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Test functions
async function testServerStatus() {
    console.log('\n🔍 Testing server status...');
    const result = await apiRequest('/test');
    
    if (result.success) {
        console.log('✅ Server is running: ', result.data);
    } else {
        console.log('❌ Server test failed: ', result.error);
    }
}

async function testLogin() {
    console.log('\n🔍 Testing login with admin credentials...');
    const result = await apiRequest('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin)
    });
    
    if (result.success) {
        console.log('✅ Login successful. User details:');
        console.log(` - Username: ${result.data.username}`);
        console.log(` - Name: ${result.data.name}`);
        console.log(` - Role: ${result.data.role}`);
        return true;
    } else {
        console.log('❌ Login failed: ', result.error);
        return false;
    }
}

async function testCurrentUser() {
    console.log('\n🔍 Testing current user endpoint...');
    const result = await apiRequest('/user');
    
    if (result.success) {
        console.log('✅ Current user retrieved: ', result.data.username);
    } else {
        console.log('❌ Current user retrieval failed: ', result.error);
    }
}

async function testDepartments() {
    console.log('\n🔍 Testing departments endpoints...');
    
    // Get all departments
    console.log('  Getting all departments...');
    const depsResult = await apiRequest('/departments');
    
    if (depsResult.success) {
        console.log(`✅ Retrieved ${depsResult.data.length} departments`);
        
        if (depsResult.data.length > 0) {
            // Display first department
            console.log(`  First department: ${depsResult.data[0].name}`);
            
            // Test get single department
            const depId = depsResult.data[0].id;
            console.log(`  Getting department with ID ${depId}...`);
            const singleDepResult = await apiRequest(`/departments/${depId}`);
            
            if (singleDepResult.success) {
                console.log(`✅ Retrieved department: ${singleDepResult.data.name}`);
            } else {
                console.log('❌ Single department retrieval failed: ', singleDepResult.error);
            }
        }
        
        // Create a new department
        console.log('  Creating a new department...');
        const newDep = {
            name: `Test Department ${Date.now()}`,
            description: 'Created by API test script'
        };
        
        const createDepResult = await apiRequest('/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDep)
        });
        
        if (createDepResult.success) {
            console.log(`✅ Created new department with ID: ${createDepResult.data.id}`);
            
            // Update the department
            const updateDepResult = await apiRequest(`/departments/${createDepResult.data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newDep,
                    description: 'Updated by API test script'
                })
            });
            
            if (updateDepResult.success) {
                console.log(`✅ Updated department`);
            } else {
                console.log('❌ Department update failed: ', updateDepResult.error);
            }
        } else {
            console.log('❌ Department creation failed: ', createDepResult.error);
        }
    } else {
        console.log('❌ Departments retrieval failed: ', depsResult.error);
    }
}

async function testUsers() {
    console.log('\n🔍 Testing users endpoints...');
    
    // Get all users
    console.log('  Getting all users...');
    const usersResult = await apiRequest('/users');
    
    if (usersResult.success) {
        console.log(`✅ Retrieved ${usersResult.data.length} users`);
        
        if (usersResult.data.length > 0) {
            // Display first user
            console.log(`  First user: ${usersResult.data[0].username}`);
            
            // Test get single user
            const userId = usersResult.data[0].id;
            console.log(`  Getting user with ID ${userId}...`);
            const singleUserResult = await apiRequest(`/users/${userId}`);
            
            if (singleUserResult.success) {
                console.log(`✅ Retrieved user: ${singleUserResult.data.username}`);
            } else {
                console.log('❌ Single user retrieval failed: ', singleUserResult.error);
            }
        }
    } else {
        console.log('❌ Users retrieval failed: ', usersResult.error);
    }
}

async function testProjects() {
    console.log('\n🔍 Testing projects endpoints...');
    
    // Get all projects
    console.log('  Getting all projects...');
    const projectsResult = await apiRequest('/projects');
    
    if (projectsResult.success) {
        console.log(`✅ Retrieved ${projectsResult.data.length} projects`);
        
        // Create a new project
        console.log('  Creating a new project...');
        const newProject = {
            name: `Test Project ${Date.now()}`,
            description: 'Created by API test script',
            status: 'In Progress'
        };
        
        const createProjectResult = await apiRequest('/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProject)
        });
        
        if (createProjectResult.success) {
            console.log(`✅ Created new project with ID: ${createProjectResult.data.id}`);
            
            // Get the project
            const projectId = createProjectResult.data.id;
            const getProjectResult = await apiRequest(`/projects/${projectId}`);
            
            if (getProjectResult.success) {
                console.log(`✅ Retrieved project: ${getProjectResult.data.name}`);
                
                // Update the project
                const updateProjectResult = await apiRequest(`/projects/${projectId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...newProject,
                        description: 'Updated by API test script'
                    })
                });
                
                if (updateProjectResult.success) {
                    console.log(`✅ Updated project`);
                } else {
                    console.log('❌ Project update failed: ', updateProjectResult.error);
                }
            } else {
                console.log('❌ Project retrieval failed: ', getProjectResult.error);
            }
        } else {
            console.log('❌ Project creation failed: ', createProjectResult.error);
        }
    } else {
        console.log('❌ Projects retrieval failed: ', projectsResult.error);
    }
}

async function testLogout() {
    console.log('\n🔍 Testing logout...');
    const result = await apiRequest('/logout', { method: 'POST' });
    
    if (result.success) {
        console.log('✅ Logout successful');
    } else {
        console.log('❌ Logout failed: ', result.error);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting API tests for ProjectPulse\n');
    
    // Test server status
    await testServerStatus();
    
    // Test login
    const loginSuccessful = await testLogin();
    if (!loginSuccessful) {
        console.log('\n❌ Login failed, cannot continue with authenticated tests.');
        rl.close();
        return;
    }
    
    // Test current user
    await testCurrentUser();
    
    // Let the user choose which tests to run
    const testsToRun = await question('\nWhich tests would you like to run? (all/departments/users/projects): ');
    
    if (testsToRun.toLowerCase() === 'all' || testsToRun.toLowerCase().includes('department')) {
        await testDepartments();
    }
    
    if (testsToRun.toLowerCase() === 'all' || testsToRun.toLowerCase().includes('user')) {
        await testUsers();
    }
    
    if (testsToRun.toLowerCase() === 'all' || testsToRun.toLowerCase().includes('project')) {
        await testProjects();
    }
    
    // Test logout
    await testLogout();
    
    console.log('\n🎉 API tests completed!');
    rl.close();
}

// Run the tests
runTests(); 