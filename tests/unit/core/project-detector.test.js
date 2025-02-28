/**
 * Unit tests for the project detector
 */
const path = require('path');
const mockFs = require('mock-fs');
const ProjectDetector = require('../../../lib/core/project-detector');

describe('Project Detector', () => {
  let detector;
  
  beforeEach(() => {
    detector = new ProjectDetector();
  });
  
  afterEach(() => {
    mockFs.restore();
  });
  
  describe('JavaScript/TypeScript detection', () => {
    test('should detect JavaScript project', async () => {
      // Set up mock file system with JavaScript project
      mockFs({
        'project': {
          'package.json': JSON.stringify({
            name: 'test-project',
            version: '1.0.0'
          }),
          'src': {
            'index.js': 'console.log("Hello World");',
            'app.js': 'const express = require("express");'
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('javascript');
      expect(result.isNode).toBe(true);
    });
    
    test('should detect TypeScript project', async () => {
      // Set up mock file system with TypeScript project
      mockFs({
        'project': {
          'package.json': JSON.stringify({
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
              typescript: '^4.0.0'
            }
          }),
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              target: 'es5'
            }
          }),
          'src': {
            'index.ts': 'console.log("Hello World");',
            'app.ts': 'import express from "express";'
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('typescript');
      expect(result.isNode).toBe(true);
    });
    
    test('should detect React project', async () => {
      // Set up mock file system with React project
      mockFs({
        'project': {
          'package.json': JSON.stringify({
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
              react: '^17.0.0',
              'react-dom': '^17.0.0'
            }
          }),
          'src': {
            'index.js': 'import React from "react";',
            'App.jsx': 'function App() { return <div>Hello</div>; }'
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('javascript');
      expect(result.isNode).toBe(true);
      expect(result.isReact).toBe(true);
    });
  });
  
  describe('Python detection', () => {
    test('should detect Python project', async () => {
      // Set up mock file system with Python project
      mockFs({
        'project': {
          'requirements.txt': 'flask==2.0.0\npandas==1.3.0',
          'setup.py': 'from setuptools import setup',
          'src': {
            'main.py': 'print("Hello World")',
            'app.py': 'from flask import Flask'
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('python');
    });
    
    test('should detect Django project', async () => {
      // Set up mock file system with Django project
      mockFs({
        'project': {
          'requirements.txt': 'django==3.2.0\npillow==8.2.0',
          'manage.py': '#!/usr/bin/env python\nimport os\nimport sys',
          'project': {
            'settings.py': 'from pathlib import Path',
            'urls.py': 'from django.urls import path'
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('python');
      expect(result.isDjango).toBe(true);
    });
  });
  
  describe('Java detection', () => {
    test('should detect Java project', async () => {
      // Set up mock file system with Java project
      mockFs({
        'project': {
          'pom.xml': '<project xmlns="http://maven.apache.org/POM/4.0.0">',
          'src': {
            'main': {
              'java': {
                'com': {
                  'example': {
                    'Main.java': 'package com.example;\n\npublic class Main {'
                  }
                }
              }
            }
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('java');
      expect(result.isMaven).toBe(true);
    });
    
    test('should detect Gradle project', async () => {
      // Set up mock file system with Gradle project
      mockFs({
        'project': {
          'build.gradle': 'plugins {\n  id "java"\n}',
          'src': {
            'main': {
              'java': {
                'com': {
                  'example': {
                    'Main.java': 'package com.example;\n\npublic class Main {'
                  }
                }
              }
            }
          }
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('java');
      expect(result.isGradle).toBe(true);
    });
  });
  
  describe('Unknown project type', () => {
    test('should return unknown for unrecognized project', async () => {
      // Set up mock file system with unrecognized project
      mockFs({
        'project': {
          'README.md': '# Test Project',
          'data.csv': 'id,name\n1,test'
        }
      });
      
      const result = await detector.detectProject('project');
      
      expect(result.type).toBe('unknown');
    });
  });
});
