/**
 * Modern Visual Stepper for Campaign Wizard
 */

import React from 'react';
import './WizardStepper.css';

const WizardStepper = ({ currentStep, steps }) => {
    return (
        <div className="wizard-stepper">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <div key={stepNumber} className="stepper-item-wrapper">
                        <div className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="stepper-circle">
                                {isCompleted ? (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <span className="stepper-number">{stepNumber}</span>
                                )}
                            </div>
                            <div className="stepper-label">
                                <div className="stepper-title">{step.title}</div>
                                {isActive && <div className="stepper-subtitle">{step.subtitle}</div>}
                            </div>
                        </div>
                        {stepNumber < steps.length && (
                            <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WizardStepper;
