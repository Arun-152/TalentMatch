import React from 'react';
import { Check, Minus } from 'lucide-react';

const SkillChip = ({ name, type }) => {
  return (
    <span className={`skill-tag skill-tag-${type}`}>
      {type === 'matched' && <Check size={11} strokeWidth={2.5} aria-hidden="true" />}
      {type === 'missing' && <Minus size={11} strokeWidth={2.5} aria-hidden="true" />}
      {name}
    </span>
  );
};

export default SkillChip;
