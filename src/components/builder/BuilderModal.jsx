function BuilderModal({
  modalState,
  modalForm,
  setModalForm,
  setModalState,
  resumeSections,
  librarySections,
  librarySectionKinds = {},
  onSubmit,
  onClose,
  onBackdropClose,
}) {
  if (!modalState.open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
      onClick={onBackdropClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {modalState.mode === 'add' ? 'Add' : 'Edit'}{' '}
            {modalState.type === 'title'
              ? 'Title'
              : modalState.type === 'section'
                ? 'Section'
                : 'Item'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300"
          >
            Close
          </button>
        </div>
        <form
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-2 select-text"
          onSubmit={onSubmit}
        >
          {modalState.type === 'title' ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Name (bold)
                  <input
                    type="text"
                    value={modalForm.name}
                    onChange={(event) =>
                      setModalForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  />
                </label>
                <label className="text-sm text-slate-300">
                  Subtitle (italic)
                  <input
                    type="text"
                    value={modalForm.subtitle}
                    onChange={(event) =>
                      setModalForm((prev) => ({
                        ...prev,
                        subtitle: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {modalForm.contacts.map((entry, index) => (
                  <div
                    key={`contact-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Contact
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setModalForm((prev) => ({
                            ...prev,
                            contacts: prev.contacts.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                        className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-400"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={entry.label}
                      onChange={(event) =>
                        setModalForm((prev) => ({
                          ...prev,
                          contacts: prev.contacts.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, label: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    />
                    <label className="mt-3 block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Link
                      <input
                        type="text"
                        value={entry.link}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            contacts: prev.contacts.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, link: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setModalForm((prev) => ({
                    ...prev,
                    contacts: [...prev.contacts, { label: '', link: '' }],
                  }))
                }
                className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Add contact
              </button>
            </div>
          ) : modalState.type === 'section' ? (
            <div className="flex flex-col gap-4">
              <label className="text-sm text-slate-300">
                Section title
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={(event) =>
                    setModalForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                />
              </label>
              {modalState.mode === 'add' && (
                <label className="text-sm text-slate-300">
                  Section type
                  <select
                    value={modalForm.sectionType || 'custom'}
                    onChange={(event) => {
                      const nextType = event.target.value
                      setModalForm((prev) => ({
                        ...prev,
                        sectionType: nextType,
                        indented: nextType === 'paragraph' ? true : prev.indented,
                      }))
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 cursor-pointer"
                  >
                    <option value="custom">Custom / Bulleted List (Default)</option>
                    <option value="education">Education-like (Degree, School, Dates, etc.)</option>
                    <option value="paragraph">Paragraph Section (Plain text narrative)</option>
                    <option value="list">Non-bulleted List (Unindented lines)</option>
                    <option value="language">Language / Single Row List</option>
                  </select>
                </label>
              )}
              {(() => {
                const sectionBeingEdited = resumeSections.find((s) => s.id === modalState.sectionId);
                const sectionKind = modalState.mode === 'add'
                  ? (modalForm.sectionType || 'custom')
                  : (modalState.target === 'library'
                      ? (librarySectionKinds[modalState.sectionId] || 'custom')
                      : (sectionBeingEdited?.kind || 'custom'));
                if (sectionKind === 'paragraph') {
                  return (
                    <label className="flex items-center gap-3 text-sm text-slate-300 mt-2 cursor-pointer bg-slate-950/40 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                      <input
                        type="checkbox"
                        checked={modalForm.indented || false}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            indented: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950 cursor-pointer"
                      />
                      <span className="select-none">Indent paragraphs (first line indent)</span>
                    </label>
                  );
                }
                return null;
              })()}
            </div>
          ) : (
            <>
              {modalState.itemType === 'education' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-slate-300">
                      Degree / Faculty (bold)
                      <input
                        type="text"
                        value={modalForm.degree}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            degree: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      University / School (bold)
                      <input
                        type="text"
                        value={modalForm.school}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            school: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Location
                      <input
                        type="text"
                        value={modalForm.location}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            location: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Program / Field (italic)
                      <input
                        type="text"
                        value={modalForm.field}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            field: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Dates
                      <input
                        type="text"
                        value={modalForm.dates}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            dates: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                  <label className="text-sm text-slate-300">
                    Bullet points (one per line)
                    <textarea
                      rows={3}
                      value={modalForm.bullets}
                      onChange={(event) =>
                        setModalForm((prev) => ({
                          ...prev,
                          bullets: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      placeholder="Use *bold*, _italics_, __underlines__, or &link(text, url) for custom formatting (one bullet per line)"
                    />
                  </label>
                </>
              )}
              {(modalState.itemType === 'custom' || modalState.itemType === 'list') && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-slate-300">
                      Item name (bold)
                      <input
                        type="text"
                        value={modalForm.itemName}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            itemName: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Location
                      <input
                        type="text"
                        value={modalForm.location}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            location: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Subtitle (italic)
                      <input
                        type="text"
                        value={modalForm.subtitle}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            subtitle: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Dates
                      <input
                        type="text"
                        value={modalForm.dates}
                        onChange={(event) =>
                          setModalForm((prev) => ({
                            ...prev,
                            dates: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      />
                    </label>
                  </div>
                  <label className="text-sm text-slate-300">
                    Details (one per line)
                    <textarea
                      rows={3}
                      value={modalForm.details}
                      onChange={(event) =>
                        setModalForm((prev) => ({
                          ...prev,
                          details: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      placeholder="Use *bold*, _italics_, __underlines__, or &link(text, url) for custom formatting (one detail per line)"
                    />
                  </label>
                </>
              )}
              {modalState.itemType === 'paragraph' && (
                <>
                  <label className="text-sm text-slate-300">
                    Paragraph label (optional - for editor organization)
                    <input
                      type="text"
                      value={modalForm.itemName}
                      onChange={(event) =>
                        setModalForm((prev) => ({
                          ...prev,
                          itemName: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      placeholder="e.g. Summary, Profile, Objectives..."
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Paragraph narrative text
                    <textarea
                      rows={6}
                      value={modalForm.paragraph}
                      onChange={(event) =>
                        setModalForm((prev) => ({
                          ...prev,
                          paragraph: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                      placeholder="Write your plain narrative text here... Use *bold*, _italics_, __underlines__, or &link(text, url) for custom formatting."
                    />
                  </label>
                </>
              )}
              {modalState.itemType === 'language' && (
                <label className="text-sm text-slate-300">
                  Languages (one per line)
                  <textarea
                    rows={4}
                    value={modalForm.languages}
                    onChange={(event) =>
                      setModalForm((prev) => ({
                        ...prev,
                        languages: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                    placeholder="Use *bold*, _italics_, __underlines__, or &link(text, url) for custom formatting (one language per line)"
                  />
                </label>
              )}
              {modalState.mode === 'edit' && (
                <label className="text-sm text-slate-300">
                  Move to Section
                  <select
                    value={modalForm.sectionId}
                    onChange={(event) => {
                      const nextSectionId = event.target.value
                      setModalForm((prev) => ({
                        ...prev,
                        sectionId: nextSectionId,
                      }))
                      
                      const inferKindFromTitle = (sectionTitle = '') => {
                        const title = sectionTitle.toLowerCase().trim()
                        if (title === 'education') return 'education'
                        if (title === 'languages' || title === 'language') return 'language'
                        return 'custom'
                      }
                      
                      if (modalState.target === 'library') {
                        const nextKind = librarySectionKinds[nextSectionId] || inferKindFromTitle(nextSectionId)
                        setModalState((prev) => ({
                          ...prev,
                          itemType: nextKind,
                        }))
                      } else {
                        const nextSection = resumeSections.find(
                          (section) => section.id === nextSectionId,
                        )
                        if (nextSection?.kind) {
                          setModalState((prev) => ({
                            ...prev,
                            itemType: nextSection.kind,
                          }))
                        }
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100"
                  >
                    <option value="">Select section</option>
                    {(modalState.target === 'library'
                      ? librarySections
                      : resumeSections.map((section) => section.id)
                    ).map((sectionKey) => {
                      const section = resumeSections.find(
                        (entry) => entry.id === sectionKey,
                      )
                      const label = section ? section.title : sectionKey
                      return (
                        <option key={sectionKey} value={sectionKey}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </label>
              )}
            </>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-slate-900 hover:text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BuilderModal
