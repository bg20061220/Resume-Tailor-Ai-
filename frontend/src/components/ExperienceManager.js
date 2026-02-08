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

  // LinkedIn import state
  const [editingParsedIndex, setEditingParsedIndex] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({
    experiences_text: '',
    projects_text: '',
    volunteering_text: '',
  });
  const [parsing, setParsing] = useState(false);
  const [parsedExperiences, setParsedExperiences] = useState([]);
  const [importError, setImportError] = useState('');
  const [savingIndex, setSavingIndex] = useState(null);

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
    // Re-open import modal if we were editing a parsed experience
    if (editingParsedIndex !== null) {
      setEditingParsedIndex(null);
      setShowImportModal(true);
    }
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
      // If we were editing a parsed experience, remove it from parsed list
      if (editingParsedIndex !== null) {
        setParsedExperiences((prev) => prev.filter((_, i) => i !== editingParsedIndex));
      }
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

  // LinkedIn import functions
  const openImportModal = () => {
    setImportForm({ experiences_text: '', projects_text: '', volunteering_text: '' });
    setParsedExperiences([]);
    setImportError('');
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportForm({ experiences_text: '', projects_text: '', volunteering_text: '' });
    setParsedExperiences([]);
    setImportError('');
  };

  const handleImportInputChange = (e) => {
    const { name, value } = e.target;
    setImportForm((prev) => ({ ...prev, [name]: value }));
  };

  const hasImportText = importForm.experiences_text.trim() ||
    importForm.projects_text.trim() ||
    importForm.volunteering_text.trim();

  const handleParse = async () => {
    setParsing(true);
    setImportError('');
    setParsedExperiences([]);

    try {
      const response = await authFetch(`${apiUrl}/api/parse-linkedin`, {
        method: 'POST',
        body: JSON.stringify(importForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to parse LinkedIn text');
      }

      const data = await response.json();
      setParsedExperiences(data.experiences || []);
    } catch (err) {
      setImportError(err.message);
    }
    setParsing(false);
  };

  const editParsedExperience = (index) => {
    const exp = parsedExperiences[index];
    setForm({
      title: exp.title || '',
      type: exp.type || 'work',
      date_range: exp.date_range || '',
      skills: exp.skills || [],
      content: exp.content || '',
    });
    setEditingId(null);
    setEditingParsedIndex(index);
    setSkillInput('');
    setError('');
    setShowImportModal(false);
    setShowModal(true);
  };

  const saveParsedExperience = async (index) => {
    const exp = parsedExperiences[index];
    setSavingIndex(index);

    const payload = {
      id: crypto.randomUUID(),
      type: exp.type || 'work',
      title: exp.title || 'Untitled',
      date_range: exp.date_range || null,
      skills: exp.skills || [],
      industry: [],
      tags: [],
      content: exp.content || '',
    };

    try {
      const response = await authFetch(`${apiUrl}/api/experiences`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save experience');
      }

      // Remove saved experience from parsed list
      setParsedExperiences((prev) => prev.filter((_, i) => i !== index));
      await fetchExperiences();
    } catch (err) {
      alert(err.message);
    }
    setSavingIndex(null);
  };

  const saveAllParsed = async () => {
    setSavingIndex('all');
    try {
      const experiences = parsedExperiences.map((exp) => ({
        id: crypto.randomUUID(),
        type: exp.type || 'work',
        title: exp.title || 'Untitled',
        date_range: exp.date_range || null,
        skills: exp.skills || [],
        industry: [],
        tags: [],
        content: exp.content || '',
      }));

      const response = await authFetch(`${apiUrl}/api/experiences/batch`, {
        method: 'POST',
        body: JSON.stringify({ experiences }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save experiences');
      }

      setParsedExperiences([]);
      await fetchExperiences();
    } catch (err) {
      alert(err.message);
    }
    setSavingIndex(null);
  };

  if (loading) {
    return <div className="experience-loading">Loading experiences...</div>;
  }

  return (
    <div className="experience-manager">
      <div className="experience-header">
        <h2>My Experiences</h2>
        <div className="experience-header-actions">
          <button onClick={openImportModal} className="import-btn">
            Import from LinkedIn
          </button>
          <button onClick={openAddModal} className="add-btn">
            + Add Experience
          </button>
        </div>
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

      {/* Add/Edit Modal */}
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

      {/* LinkedIn Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Import from LinkedIn</h2>
            <p className="import-hint">
              Go to your LinkedIn profile, copy the text from each section, and paste it below.
              Leave sections empty if you don't want to import them.
            </p>

            {parsedExperiences.length === 0 ? (
              <>
                <div className="form-group">
                  <label htmlFor="experiences_text">Work Experience</label>
                  <textarea
                    id="experiences_text"
                    name="experiences_text"
                    value={importForm.experiences_text}
                    onChange={handleImportInputChange}
                    placeholder="Paste your LinkedIn work experience section here..."
                    rows={5}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projects_text">Projects</label>
                  <textarea
                    id="projects_text"
                    name="projects_text"
                    value={importForm.projects_text}
                    onChange={handleImportInputChange}
                    placeholder="Paste your LinkedIn projects section here..."
                    rows={5}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="volunteering_text">Volunteering</label>
                  <textarea
                    id="volunteering_text"
                    name="volunteering_text"
                    value={importForm.volunteering_text}
                    onChange={handleImportInputChange}
                    placeholder="Paste your LinkedIn volunteering section here..."
                    rows={5}
                  />
                </div>

                {importError && <div className="error-message">{importError}</div>}

                <div className="modal-actions">
                  <button type="button" onClick={closeImportModal} className="cancel-btn">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={parsing || !hasImportText}
                  >
                    {parsing ? 'Parsing...' : 'Parse'}
                  </button>
                </div>
              </>
            ) : (
              <div className="parsed-results">
                <div className="parsed-results-header">
                  <p>Found {parsedExperiences.length} experience{parsedExperiences.length !== 1 ? 's' : ''}. Review and save:</p>
                  <button
                    onClick={saveAllParsed}
                    className="save-all-btn"
                    disabled={savingIndex !== null}
                  >
                    {savingIndex === 'all' ? 'Saving All...' : 'Save All'}
                  </button>
                </div>

                {parsedExperiences.map((exp, index) => (
                  <div key={index} className="parsed-experience-card">
                    <div className="parsed-experience-header">
                      <span className="experience-type-badge">{getTypeLabel(exp.type)}</span>
                      <div className="parsed-experience-actions">
                        <button
                          onClick={() => editParsedExperience(index)}
                          className="edit-btn"
                          disabled={savingIndex !== null}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => saveParsedExperience(index)}
                          className="add-btn"
                          disabled={savingIndex !== null}
                        >
                          {savingIndex === index ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                    <h3>{exp.title}</h3>
                    {exp.date_range && <p className="date-range">{exp.date_range}</p>}
                    {exp.skills && exp.skills.length > 0 && (
                      <div className="skills-list">
                        {exp.skills.map((skill) => (
                          <span key={skill} className="skill-tag-sm">{skill}</span>
                        ))}
                      </div>
                    )}
                    <p className="content-preview">
                      {exp.content?.substring(0, 200)}
                      {exp.content?.length > 200 ? '...' : ''}
                    </p>
                  </div>
                ))}

                <div className="modal-actions">
                  <button type="button" onClick={closeImportModal} className="cancel-btn">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
