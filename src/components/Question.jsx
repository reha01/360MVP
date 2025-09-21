// src/components/Question.jsx
import React from 'react';

const Question = ({ question }) => {
  return (
    <div>
      <h4>{question?.text}</h4>
      {/* TODO: Render options based on question type */}
    </div>
  );
};

export default Question;
