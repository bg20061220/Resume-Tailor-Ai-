import React, { useState, useEffect } from 'react';

const EXPERIENCE_TYPES = [
  { value: 'work', label: 'Work Experience' },
  { value: 'project', label: 'Project' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  title: '',
  type: 'work',
  date_range: '',
  skills: [],
  content: '',
};

export function ExperienceManager({ authFetch, apiUrl }) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch experiences on mount
  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/experiences`);
      const data = await response.json();
      setExperiences(data.experiences || []);
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSkillInput('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setForm({
      title: exp.title,
      type: exp.type,
      date_range: exp.date_range || '',
      skills: exp.skills || [],
      content: exp.content || '',
    });
    setEditingId(exp.id);
    setSkillInput('');
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    }
    setSkillInput('');
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const removeSkill = (skillToRemove) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      id: editingId || crypto.randomUUID(),
      type: form.type,
      title: form.title,
      date_range: form.date_range || null,
      skills: form.skills,
      industry: [],
      tags: [],
      content: form.content,
    };

    try {
      let response;
      if (editingId) {
        // Update existing
        response = await authFetch(`${apiUrl}/api/experiences/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        response = await authFetch(`${apiUrl}/api/experiences`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save experience');
      }

      await fetchExperiences();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this experience?')) {
      return;
    }

    try {
      const response = await authFetch(`${apiUrl}/api/experiences/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete experience');
      }

      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const getTypeLabel = (type) => {
    return EXPERIENCE_TYPES.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return <div className="experience-loading">Loading experiences...</div>;
  }

  return (
    <div className="experience-manager">
      <div className="experience-header">
        <h2>My Experiences</h2>
        <button onClick={openAddModal} className="add-btn">
          + Add Experience
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="no-experiences">
          <p>No experiences yet. Add your first experience to get started!</p>
        </div>
      ) : (
        <div className="experience-grid">
          {experiences.map((exp) => (
            <div key={exp.id} className="experience-card">
              <div className="experience-card-header">
                <span className="experience-type-badge">{getTypeLabel(exp.type)}</span>
                <div className="experience-actions">
                  <button onClick={() => openEditModal(exp)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(exp.id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
              <h3>{exp.title}</h3>
              {exp.date_range && <p className="date-range">{exp.date_range}</p>}
              {exp.skills && exp.skills.length > 0 && (
                <div className="skills-list">
                  {exp.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <p className="content-preview">
                {exp.content?.substring(0, 150)}
                {exp.content?.length > 150 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Experience' : 'Add Experience'}</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior Software Engineer at Google"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleInputChange}
                  required
                >
                  {EXPERIENCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="date_range">Date Range</label>
                <input
                  id="date_range"
                  name="date_range"
                  type="text"
                  value={form.date_range}
                  onChange={handleInputChange}
                  placeholder="e.g., Jan 2020 - Present"
                />
              </div>

              <div className="form-group">
                <label>Skills</label>
                <div className="skills-input-container">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="Type a skill and press Enter"
                  />
                  <button type="button" onClick={addSkill} className="add-skill-btn">
                    Add
                  </button>
                </div>
                <div className="skills-list editable">
                  {form.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="remove-skill"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="content">Description *</label>
                <textarea
                  id="content"
                  name="content"
                  value={form.content}
                  onChange={handleInputChange}
                  placeholder="Describe your experience, achievements, and responsibilities..."
                  rows={6}
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
