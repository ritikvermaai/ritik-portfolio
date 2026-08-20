const navItems =
    document.querySelectorAll(".nav-item");

const sections =
    document.querySelectorAll(".section");

const quickButtons =
    document.querySelectorAll(".quick-btn");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");

let projectExistingImages = [];
let projectNewFiles = [];


/* ================= AUTH CHECK ================= */

async function checkAdmin() {

    try {

        const response =
            await fetch("/admin/status");

        const data =
            await response.json();

        if (!data.loggedIn) {

            window.location.href =
                "/admin/admin.html";

            return false;
        }

        return true;

    } catch (error) {

        console.error(error);

        window.location.href =
            "/admin/admin.html";

        return false;
    }
}


/* ================= SECTION SWITCH ================= */

function showSection(sectionName) {

    sections.forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });

    navItems.forEach(item => {

        item.classList.remove("active");

    });

    const target =
        document.getElementById(sectionName);

    if (target) {

        target.classList.add(
            "active-section"
        );
    }

    navItems.forEach(item => {

        if (
            item.dataset.section ===
            sectionName
        ) {

            item.classList.add("active");

        }

    });

    sidebar.classList.remove("open");

    if (sectionName === "projects") {

        loadProjects();

    }

    if (sectionName === "donations") {

        loadDonations();

    }

    if (sectionName === "visitors") {

        loadVisitors();

    }

    if (sectionName === "gallery") {

    loadGallery();

    }

    if (sectionName === "settings") {

    loadSettings();

}

   if (sectionName === "website-builder") {

    if (!websiteBuilderLoaded) {
        loadWebsiteBuilder();
    }

}

    if (sectionName === "messages") {
    loadMessages();
}

}


/* ================= NAV EVENTS ================= */

navItems.forEach(item => {

    item.addEventListener("click", () => {

        showSection(
            item.dataset.section
        );

    });

});


quickButtons.forEach(button => {

    button.addEventListener("click", () => {

        showSection(
            button.dataset.section
        );

    });

});


/* ================= MOBILE MENU ================= */

menuButton.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle("open");

    }
);


/* =====================================================
   PROJECT MANAGER
===================================================== */

let adminProjects = [];

let currentProjectId = null;


/* ================= LOAD PROJECTS ================= */

async function loadProjects() {

    const container =
        document.getElementById(
            "projectsContent"
        );


    container.innerHTML = `
        <div class="loading-box">
            Loading projects...
        </div>
    `;


    try {

        const response =
            await fetch(
                "/admin/projects"
            );


        if (response.status === 401) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to load projects"
            );

        }


        adminProjects =
            data.projects || [];


        document.getElementById(
            "projectStat"
        ).textContent =
            adminProjects.length;


        renderProjects();


    } catch (error) {

        console.error(error);


        container.innerHTML = `
            <div class="empty-projects">
                Failed to load projects.
            </div>
        `;

    }

}


/* ================= RENDER PROJECTS ================= */

function renderProjects() {
    const container = document.getElementById("projectsContent");
    const search = (document.getElementById("projectSearch")?.value || "").trim().toLowerCase();
    const filter = document.getElementById("projectFilter")?.value || "all";
    const filtered = adminProjects.filter(project => {
        const haystack = `${project.title || ""} ${project.category || ""} ${project.description || ""} ${(project.technologies || []).join(" ")}`.toLowerCase();
        return haystack.includes(search) && (filter === "all" || (project.category || "Other") === filter);
    });
    if (!filtered.length) {
        container.innerHTML = `<div class="empty-projects"><strong>No portfolio projects found.</strong><br><span>Add your first project using + Add Project.</span></div>`;
        return;
    }
    container.innerHTML = filtered.map(project => {
        const tech = Array.isArray(project.technologies) ? project.technologies : [];
        const projectImages = Array.isArray(project.images) && project.images.length ? project.images : (project.imageUrl ? [project.imageUrl] : []);
        const image = projectImages.length ? `<img src="${escapeHTML(projectImages[0])}" alt="${escapeHTML(project.title)}" class="admin-project-image">` : `<div class="admin-project-placeholder">⌘</div>`;
        const featured = project.featured ? `<span class="featured-badge">★ Featured</span>` : "";
        return `
        <article class="project-card portfolio-admin-card" data-id="${project._id}">
            <div class="admin-project-cover">${image}${featured}</div>
            <div class="project-top">
                <div><div class="project-name">${escapeHTML(project.title)}</div><div class="admin-project-category">${escapeHTML(project.category || "Project")}</div></div>
            </div>
            <p class="admin-project-description">${escapeHTML(project.description || "No description added.")}</p>
            <div class="admin-project-tech">${tech.slice(0,6).map(t=>`<span>${escapeHTML(t)}</span>`).join("")}</div>
            <div class="project-date">Added: ${project.createdAt ? new Date(project.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "Unknown"}</div>
            <div class="project-actions">
                <button class="project-action" onclick="viewProject('${project._id}')">👁 Preview</button>
                <button class="project-action" onclick="editProject('${project._id}')">✏ Edit</button>
                <button class="project-action delete" onclick="deleteProject('${project._id}')">🗑 Delete</button>
            </div>
        </article>`;
    }).join("");
}

/* ================= OPEN ADD MODAL ================= */

function openAddProjectModal() {

    currentProjectId = null;


    document.getElementById(
        "projectModalTitle"
    ).textContent =
        "Add Project";


    document.getElementById(
        "projectForm"
    ).reset();


    document.getElementById(
        "projectId"
    ).value = "";


    document.getElementById("projectFormError").textContent = "";
    document.getElementById("projectCategory").value = "Web Development";
    document.getElementById("projectTechnologies").value = "";
    document.getElementById("projectLiveUrl").value = "";
    document.getElementById("projectGithubUrl").value = "";
    projectExistingImages = [];
    projectNewFiles = [];
    document.getElementById("projectImages").value = "";
    document.getElementById("projectFeatured").checked = false;
    renderProjectImagePreview();


    document.getElementById(
        "projectModal"
    ).classList.add("show");

}


/* ================= EDIT PROJECT ================= */

async function editProject(id) {

    try {

        const response =
            await fetch(
                `/admin/projects/${id}`
            );


        if (response.status === 401) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            adminAlert(
                data.message ||
                "Failed to load project."
            );

            return;

        }


        const project =
            data.project;


        currentProjectId =
            project._id;


        document.getElementById(
            "projectModalTitle"
        ).textContent =
            "Edit Project";


        document.getElementById(
            "projectId"
        ).value =
            project._id;


        document.getElementById(
            "projectTitle"
        ).value =
            project.title;


        document.getElementById("projectCategory").value = project.category || "Web Development";
        document.getElementById("projectDescription").value = project.description || "";
        document.getElementById("projectTechnologies").value = (project.technologies || []).join(", ");
        document.getElementById("projectLiveUrl").value = project.liveUrl || "";
        document.getElementById("projectGithubUrl").value = project.githubUrl || "";
        projectExistingImages = Array.isArray(project.images) && project.images.length ? [...project.images] : (project.imageUrl ? [project.imageUrl] : []);
        projectNewFiles = [];
        document.getElementById("projectImages").value = "";
        document.getElementById("projectFeatured").checked = Boolean(project.featured);
        renderProjectImagePreview();


        document.getElementById(
            "projectFormError"
        ).textContent = "";


        document.getElementById(
            "projectModal"
        ).classList.add("show");


    } catch (error) {

        console.error(error);

        adminAlert(
            "Failed to load project."
        );

    }

}


/* ================= VIEW PROJECT ================= */

async function viewProject(id) {
    try {
        const response = await fetch(`/admin/projects/${id}`);
        const data = await response.json();
        if (!data.success) return adminAlert(data.message || "Failed to load project.");
        const project = data.project;
        document.getElementById("codeModalTitle").textContent = project.title;
        document.getElementById("codeModalLanguage").textContent = project.category || "Project Details";
        const tech = (project.technologies || []).map(t => `<span>${escapeHTML(t)}</span>`).join("");
        const previewImages = Array.isArray(project.images) && project.images.length ? project.images : (project.imageUrl ? [project.imageUrl] : []);
        const previewGallery = previewImages.length ? `<div class="project-preview-gallery">${previewImages.map((url, i) => `<img src="${escapeHTML(url)}" class="project-preview-image" alt="${escapeHTML(project.title)} photo ${i+1}">`).join("")}</div>` : "";
        document.getElementById("projectPreviewContent").innerHTML = `
            ${previewGallery}
            <p class="project-preview-description">${escapeHTML(project.description || "No description available.")}</p>
            <div class="project-preview-tech">${tech}</div>
            <div class="project-preview-links">
                ${project.liveUrl ? `<a href="${escapeHTML(project.liveUrl)}" target="_blank" rel="noopener noreferrer" class="primary-btn">🌐 Live Project</a>` : ""}
                ${project.githubUrl ? `<a href="${escapeHTML(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="secondary-btn">⌘ GitHub</a>` : ""}
            </div>`;
        document.getElementById("codeModal").classList.add("show");
    } catch (error) { console.error(error); adminAlert("Failed to load project."); }
}

/* ================= DOWNLOAD ================= */

async function downloadProject(id) {

    try {

        const response =
            await fetch(
                `/admin/projects/${id}`
            );


        const data =
            await response.json();


        if (!data.success) {

            adminAlert(
                data.message ||
                "Project not found."
            );

            return;

        }


        const project =
            data.project;


        const extension =
            project.language === "cpp"
                ? "cpp"
                : "c";


        const blob =
            new Blob(
                [project.code],
                {
                    type:
                        "text/plain"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;


        link.download =
            `${project.title}.${extension}`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


    } catch (error) {

        console.error(error);

        adminAlert(
            "Download failed."
        );

    }

}


/* ================= DELETE ================= */

async function deleteProject(id) {

    const project =
        adminProjects.find(
            item =>
                item._id === id
        );


    if (!project) {

        return;

    }


    const confirmed =
        await appConfirm({

            title:
                "Delete Project?",

            subtitle:
                "This action cannot be undone.",

            message:
                `Are you sure you want to delete "${project.title}"?`,

            icon:
                "🗑️"

        });


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/admin/projects/${id}`,
                {
                    method:
                        "DELETE"
                }
            );


        if (response.status === 401) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            adminAlert(
                data.message ||
                "Failed to delete project."
            );

            return;

        }


        await loadProjects();


        adminAlert(
            "Project deleted successfully."
        );


    } catch (error) {

        console.error(error);

        adminAlert(
            "Delete failed."
        );

    }

}


/* ================= PROJECT PHOTO UPLOADER ================= */

function renderProjectImagePreview(){
    const box = document.getElementById("projectImagePreview");
    if (!box) return;
    const existing = projectExistingImages.map((url, index) => `
        <div class="project-image-thumb">
            <img src="${escapeHTML(url)}" alt="Project photo ${index + 1}">
            <button type="button" title="Remove photo" onclick="removeExistingProjectImage(${index})">×</button>
        </div>`).join("");
    const fresh = projectNewFiles.map((file, index) => {
        const src = URL.createObjectURL(file);
        return `<div class="project-image-thumb project-image-new"><img src="${src}" alt="New project photo ${index + 1}"><button type="button" title="Remove photo" onclick="removeNewProjectImage(${index})">×</button></div>`;
    }).join("");
    box.innerHTML = existing + fresh;
    const count = projectExistingImages.length + projectNewFiles.length;
    const hint = document.getElementById("projectUploadHint");
    if (hint) hint.textContent = `${count}/5 photos selected${count >= 5 ? " — maximum reached" : ""}`;
}

function removeExistingProjectImage(index){
    projectExistingImages.splice(index,1);
    renderProjectImagePreview();
}

function removeNewProjectImage(index){
    projectNewFiles.splice(index,1);
    renderProjectImagePreview();
}

const chooseProjectImages = document.getElementById("chooseProjectImages");
const projectImagesInput = document.getElementById("projectImages");
if (chooseProjectImages && projectImagesInput){
    chooseProjectImages.addEventListener("click", () => projectImagesInput.click());
    projectImagesInput.addEventListener("change", () => {
        const incoming = Array.from(projectImagesInput.files || []);
        const allowed = 5 - projectExistingImages.length - projectNewFiles.length;
        const valid = incoming.filter(file => file.type.startsWith("image/"));
        projectNewFiles = projectNewFiles.concat(valid.slice(0, Math.max(0, allowed)));
        if (valid.length > Math.max(0, allowed)) adminAlert("You can upload a maximum of 5 photos per project.");
        projectImagesInput.value = "";
        renderProjectImagePreview();
    });
}

async function uploadProjectImages(){
    if (!projectNewFiles.length) return [];
    const formData = new FormData();
    projectNewFiles.forEach(file => formData.append("images", file));
    const response = await fetch("/admin/projects/upload-images", { method:"POST", body:formData });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Project image upload failed.");
    return Array.isArray(data.images) ? data.images : [];
}

/* ================= SAVE PORTFOLIO PROJECT ================= */
document.getElementById("projectForm").addEventListener("submit", async event => {
    event.preventDefault();
    const title = document.getElementById("projectTitle").value.trim();
    const category = document.getElementById("projectCategory").value;
    const description = document.getElementById("projectDescription").value.trim();
    const technologies = document.getElementById("projectTechnologies").value.split(",").map(v=>v.trim()).filter(Boolean);
    const liveUrl = document.getElementById("projectLiveUrl").value.trim();
    const githubUrl = document.getElementById("projectGithubUrl").value.trim();
    const featured = document.getElementById("projectFeatured").checked;
    const errorBox = document.getElementById("projectFormError");
    errorBox.textContent = "";
    if (!title || !description) { errorBox.textContent = "Project title and description are required."; return; }
    if (projectExistingImages.length + projectNewFiles.length > 5) { errorBox.textContent = "You can keep a maximum of 5 project photos."; return; }
    const id = document.getElementById("projectId").value;
    const isEdit = Boolean(id);
    try {
        const uploadedImages = await uploadProjectImages();
        const images = [...projectExistingImages, ...uploadedImages].slice(0,5);
        const response = await fetch(isEdit ? `/admin/projects/${id}` : "/admin/projects", {
            method: isEdit ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, category, description, technologies, liveUrl, githubUrl, images, imageUrl: images[0] || "", featured })
        });
        const data = await response.json();
        if (!response.ok || !data.success) { errorBox.textContent = data.message || "Failed to save project."; return; }
        closeProjectModal();
        projectExistingImages = [];
        projectNewFiles = [];
        await loadProjects();
        adminAlert(isEdit ? "Project updated successfully." : "Project added successfully.");
    } catch (error) { console.error(error); errorBox.textContent = error.message || "Network error. Please try again."; }
});

document
    .getElementById("projectSearch")
    .addEventListener(
        "input",
        renderProjects
    );


/* ================= FILTER ================= */

document
    .getElementById("projectFilter")
    .addEventListener(
        "change",
        renderProjects
    );


/* ================= ADD BUTTON ================= */

document
    .getElementById("addProjectBtn")
    .addEventListener(
        "click",
        openAddProjectModal
    );


/* ================= CLOSE MODAL ================= */

function closeProjectModal() {

    document
        .getElementById("projectModal")
        .classList.remove("show");

}


document
    .getElementById("closeProjectModal")
    .addEventListener(
        "click",
        closeProjectModal
    );


document
    .getElementById("cancelProjectBtn")
    .addEventListener(
        "click",
        closeProjectModal
    );


document
    .getElementById("closeCodeModal")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "codeModal"
                )
                .classList.remove(
                    "show"
                );

        }
    );


/* ================= CLOSE MODALS ON BACKDROP ================= */

document
    .getElementById("projectModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "projectModal"
            ) {

                closeProjectModal();

            }

        }
    );


document
    .getElementById("codeModal")
    .addEventListener(
        "click",
        event => {

            if (
                event.target.id ===
                "codeModal"
            ) {

                document
                    .getElementById(
                        "codeModal"
                    )
                    .classList.remove(
                        "show"
                    );

            }

        }
    );

/* ================= GALLERY ================= */

async function loadGallery() {
    const container =
        document.getElementById(
            "galleryContent"
        );

    try {
        const response =
            await fetch(
                "/admin/api/gallery"
            );

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        const galleryStat =
            document.getElementById(
                "galleryStat"
            );

        if (galleryStat) {
            galleryStat.textContent =
                data.images
                    ? data.images.length
                    : 0;
        }

        if (!data.success) {
            container.innerHTML = `
                <p class="coming">
                    ${escapeHTML(
                        data.message ||
                        "Failed to load gallery."
                    )}
                </p>
            `;
            return;
        }

        if (!data.images.length) {
            container.innerHTML = `
                <p class="coming">
                    No gallery images yet.
                </p>
            `;
            return;
        }

        container.innerHTML = `
            <h3 style="
                color:#00f7ff;
                margin-bottom:20px;
            ">
                Gallery Images
                (${data.images.length})
            </h3>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(260px, 1fr)
                    );
                gap:20px;
            ">
                ${data.images.map(image => `
                    <div style="
                        background:#0f172a;
                        border:1px solid
                            rgba(0,247,255,.15);
                        border-radius:12px;
                        overflow:hidden;
                    ">
                        <img
                            src="${escapeHTML(
                                image.imageUrl
                            )}"
                            alt="${escapeHTML(
                                image.title
                            )}"
                            style="
                                width:100%;
                                height:200px;
                                object-fit:cover;
                                display:block;
                                cursor:pointer;
                            "
                            onclick="
                                viewGalleryImage(
                                    '${image._id}'
                                )
                            "
                        >

                        <div style="padding:15px;">
                            <strong>
                                ${escapeHTML(
                                    image.title
                                )}
                            </strong>

                            <p style="
                                color:#cbd5e1;
                                font-size:13px;
                                line-height:1.5;
                                margin:8px 0;
                            ">
                                ${escapeHTML(
                                    image.description ||
                                    "No description"
                                )}
                            </p>

                            <p style="
                                color:#94a3b8;
                                font-size:12px;
                                margin:8px 0;
                            ">
                                ${
                                    image.visible
                                    ? "🟢 Visible"
                                    : "🔴 Hidden"
                                }
                            </p>

                            <div style="
                                display:flex;
                                gap:8px;
                                flex-wrap:wrap;
                                margin-top:12px;
                            ">
                                <button
                                    class="project-action"
                                    onclick="
                                        viewGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    👁 View
                                </button>

                                <button
                                    class="project-action"
                                    onclick="
                                        editGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    ✏ Edit
                                </button>

                                <button
                                    class="project-action"
                                    onclick="
                                        downloadGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    ⬇ Download
                                </button>

                                <button
                                    class="
                                        project-action
                                        delete
                                    "
                                    onclick="
                                        deleteGalleryImage(
                                            '${image._id}'
                                        )
                                    "
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

    } catch (error) {
        console.error(
            "Gallery error:",
            error
        );

        container.innerHTML = `
            <p class="coming">
                Failed to load gallery.
            </p>
        `;
    }
}


/* ================= EDIT GALLERY ================= */

async function editGalleryImage(id) {

    try {

        const response =
            await fetch(
                `/admin/api/gallery/${id}`
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "/admin/admin.html";

            return;

        }


        const data =
            await response.json();


        if (!data.success) {

            await appNotice({

                title:
                    "Unable to Load Image",

                subtitle:
                    "Gallery information could not be loaded.",

                message:
                    data.message ||
                    "Please try again.",

                icon:
                    "❌",

                type:
                    "danger"

            });

            return;

        }


        const image =
            data.image;


        const result =
            await openAppModal({

                title:
                    "Edit Gallery Image",

                subtitle:
                    "Update the image information.",

                icon:
                    "🖼️",

                body: `

                    <div class="app-modal-field">

                        <label>
                            Image Title
                        </label>

                        <input
                            id="editGalleryTitle"
                            type="text"
                            value="${escapeHTML(
                                image.title || ""
                            )}"
                            placeholder="Enter image title"
                        >

                    </div>


                    <div class="app-modal-field">

                        <label>
                            Description
                        </label>

                        <textarea
                            id="editGalleryDescription"
                            placeholder="Enter image description"
                        >${escapeHTML(
                            image.description || ""
                        )}</textarea>

                    </div>

                `,

                buttons: [

                    {
                        text:
                            "Cancel",

                        type:
                            "cancel",

                        value:
                            null

                    },

                    {
                        text:
                            "Save Changes",

                        type:
                            "primary",

                        value:
                            "save"

                    }

                ]

            });


        if (
            result !==
            "save"
        ) {

            return;

        }


        const title =
            document
                .getElementById(
                    "editGalleryTitle"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "editGalleryDescription"
                )
                .value
                .trim();


        if (!title) {

            await appNotice({

                title:
                    "Title Required",

                subtitle:
                    "The image title cannot be empty.",

                message:
                    "Please enter a title for this image.",

                icon:
                    "⚠️"

            });

            return;

        }


        const updateResponse =
            await fetch(
                `/admin/api/gallery/${id}`,
                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            title,

                            description

                        })

                }
            );


        const updateResult =
            await updateResponse.json();


        if (
            !updateResponse.ok ||
            !updateResult.success
        ) {

            await appNotice({

                title:
                    "Update Failed",

                subtitle:
                    "Gallery image could not be updated.",

                message:
                    updateResult.message ||
                    "Please try again.",

                icon:
                    "❌",

                type:
                    "danger"

            });

            return;

        }


        await loadGallery();


        await appNotice({

            title:
                "Image Updated",

            subtitle:
                "Your changes have been saved.",

            message:
                "Gallery image details updated successfully.",

            icon:
                "✅"

        });


    } catch (error) {

        console.error(
            "Gallery edit error:",
            error
        );


        await appNotice({

            title:
                "Something Went Wrong",

            subtitle:
                "Unable to edit the gallery image.",

            message:
                "Please try again.",

            icon:
                "❌",

            type:
                "danger"

        });

    }

}


/* ================= VIEW GALLERY ================= */

async function viewGalleryImage(id) {
    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}`
            );

        const data =
            await response.json();

        if (!data.success) {
            adminAlert(
                data.message ||
                "Image not found."
            );
            return;
        }

        window.open(
            data.image.imageUrl,
            "_blank"
        );

    } catch (error) {
        console.error(error);
        adminAlert(
            "Unable to open image."
        );
    }
}


/* ================= DOWNLOAD GALLERY ================= */

async function downloadGalleryImage(id) {
    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}/download`
            );

        if (!response.ok) {
            adminAlert("Download failed.");
            return;
        }

        const blob =
            await response.blob();

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            "gallery-image";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        adminAlert(
            "Download failed."
        );
    }
}


/* ================= DELETE GALLERY ================= */

async function deleteGalleryImage(id) {
    const confirmed =
    await appConfirm({

        title:
            "Delete Gallery Image?",

        subtitle:
            "This will remove the image permanently.",

        message:
            "The image will be removed from both MongoDB and Cloudinary.",

        icon:
            "🗑️"

    });

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `/admin/api/gallery/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        if (!data.success) {
            adminAlert(
                data.message ||
                "Failed to delete image."
            );
            return;
        }

        await loadGallery();

        adminAlert(
            "Image deleted successfully."
        );

    } catch (error) {
        console.error(
            "Gallery delete error:",
            error
        );

        adminAlert(
            "Delete failed."
        );
    }
}


/* ================= GALLERY UPLOAD ================= */

const galleryUploadForm =
    document.getElementById(
        "galleryUploadForm"
    );


if (galleryUploadForm) {

    galleryUploadForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const message =
                document.getElementById(
                    "galleryMessage"
                );


            const title =
                document.getElementById(
                    "galleryTitle"
                ).value.trim();

            const description =
                 document.getElementById(
                         "galleryDescription"
                ).value.trim();                


            const image =
                document.getElementById(
                    "galleryImage"
                ).files[0];


            if (!title) {

                message.textContent =
                    "Please enter an image title.";

                return;

            }


            if (!image) {

                message.textContent =
                    "Please select an image.";

                return;

            }


            message.textContent =
                "Uploading image...";


            const formData =
                new FormData();


            formData.append(
                "title",
                title
            );

            formData.append(
                "description",
                 description
            );

            formData.append(
                "image",
                image
            );


            try {

                const response =
                    await fetch(
                        "/admin/api/gallery",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok ||
                    !data.success) {

                    message.textContent =
                        data.message ||
                        "Upload failed.";

                    return;

                }


                message.textContent =
                    "✅ Image uploaded successfully!";


                galleryUploadForm.reset();


                await loadGallery();


            } catch (error) {

                console.error(
                    "Gallery upload error:",
                    error
                );


                message.textContent =
                    "❌ Unable to upload image.";

            }

        }
    );

}


/* ================= DONATIONS ================= */

async function loadDonations() {

    const container =
        document.getElementById("donationsContent");

    try {

        const response =
            await fetch("/admin/api/donations");

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load donations"
            );
        }

        const donations = data.donations || [];

        const totalAmount = donations.reduce(
            (total, donation) =>
                total + Number(donation.amount || 0),
            0
        );

        document.getElementById(
            "donationStat"
        ).textContent =
            totalAmount.toLocaleString("en-IN");


        if (!donations.length) {

            container.innerHTML = `
                <p class="coming">
                    No donations yet.
                </p>
            `;

            return;
        }


        container.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:25px;
            ">

                <div>

                    <h3 style="
                        font-size:28px;
                        color:#00f7ff;
                        margin:0;
                    ">
                        ₹${totalAmount.toLocaleString("en-IN")}
                    </h3>

                    <p style="
                        color:#94a3b8;
                        margin-top:5px;
                    ">
                        ${donations.length} total donors
                    </p>

                </div>

            </div>


            ${donations.map(donation => `

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:20px;
                    padding:18px 0;
                    border-bottom:1px solid
                    rgba(255,255,255,.08);
                ">

                    <div>

                        <strong style="
                            font-size:16px;
                        ">
                            ${escapeHTML(
                                donation.name || "Anonymous"
                            )}
                        </strong>

                        <div style="
                            color:#64748b;
                            font-size:12px;
                            margin-top:5px;
                        ">
                            ${escapeHTML(
                                donation.email || ""
                            )}
                        </div>

                        <div style="
                            color:#64748b;
                            font-size:11px;
                            margin-top:5px;
                        ">
                            ${donation.date
                                ? new Date(
                                    donation.date
                                ).toLocaleString("en-IN")
                                : ""
                            }
                        </div>

                    </div>


                    <div style="
                        display:flex;
                        align-items:center;
                        gap:20px;
                    ">

                        <strong style="
                            color:#00f7ff;
                            font-size:18px;
                            white-space:nowrap;
                        ">
                            ₹${Number(
                                donation.amount || 0
                            ).toLocaleString("en-IN")}
                        </strong>

                        <button
                            class="project-action"
                            onclick="editDonation(
                            '${donation._id}',
                            '${escapeHTML(donation.name || "")}',
                           '${escapeHTML(donation.email || "")}',
                            '${donation.amount || 0}'
                           )"
                        >
                            ✏️ Edit
                        </button>
                        
                        <button
                            class="project-action"
                            onclick="deleteDonation('${donation._id}')"
                            style="
                                color:#ff6b6b;
                            "
                        >
                            🗑 Delete
                        </button>

                    </div>

                </div>

            `).join("")}

        `;

    } catch (error) {

        console.error(
            "Donation loading error:",
            error
        );

        container.innerHTML = `
            <p class="coming">
                ❌ Failed to load donations.
            </p>
        `;
    }
}



async function deleteDonation(id) {

    const confirmed =
    await appConfirm({

        title:
            "Delete Donation?",

        subtitle:
            "This action cannot be undone.",

        message:
            "Are you sure you want to permanently delete this donation?",

        icon:
            "🗑️"

    });

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/admin/api/donations/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            adminAlert(
                data.message ||
                "Failed to delete donation."
            );

            return;
        }

        adminAlert("Donation deleted successfully.");

        await loadDonations();

    } catch (error) {

        console.error(
            "Delete donation error:",
            error
        );

        adminAlert(
            "Unable to delete donation."
        );
    }
}

async function editDonation(
    id,
    currentName,
    currentEmail,
    currentAmount
) {

    const result =
        await openAppModal({

            title:
                "Edit Donation",

            subtitle:
                "Update the donor information and donation amount.",

            icon:
                "💙",

            body: `

                <div class="app-modal-field">

                    <label>
                        Donor Name
                    </label>

                    <input
                        id="editDonationName"
                        type="text"
                        value="${escapeHTML(
                            currentName || ""
                        )}"
                        placeholder="Enter donor name"
                    >

                </div>


                <div class="app-modal-field">

                    <label>
                        Donor Email
                    </label>

                    <input
                        id="editDonationEmail"
                        type="email"
                        value="${escapeHTML(
                            currentEmail || ""
                        )}"
                        placeholder="Enter donor email"
                    >

                </div>


                <div class="app-modal-field">

                    <label>
                        Donation Amount
                    </label>

                    <input
                        id="editDonationAmount"
                        type="number"
                        min="1"
                        value="${Number(
                            currentAmount || 0
                        )}"
                        placeholder="Enter amount"
                    >

                </div>

            `,

            buttons: [

                {
                    text:
                        "Cancel",

                    type:
                        "cancel",

                    value:
                        null

                },

                {
                    text:
                        "Save Changes",

                    type:
                        "primary",

                    value:
                        "save"

                }

            ]

        });


    if (
        result !==
        "save"
    ) {

        return;

    }


    const name =
        document
            .getElementById(
                "editDonationName"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "editDonationEmail"
            )
            .value
            .trim();


    const amount =
        Number(
            document
                .getElementById(
                    "editDonationAmount"
                )
                .value
        );


    if (!name) {

        await appNotice({

            title:
                "Name Required",

            subtitle:
                "Please check the donor information.",

            message:
                "Donor name cannot be empty.",

            icon:
                "⚠️",

            type:
                "primary"

        });

        return;

    }


    if (!email) {

        await appNotice({

            title:
                "Email Required",

            subtitle:
                "Please check the donor information.",

            message:
                "Donor email cannot be empty.",

            icon:
                "⚠️",

            type:
                "primary"

        });

        return;

    }


    if (
        !amount ||
        amount <= 0
    ) {

        await appNotice({

            title:
                "Invalid Amount",

            subtitle:
                "Please enter a valid donation amount.",

            message:
                "Donation amount must be greater than ₹0.",

            icon:
                "⚠️",

            type:
                "primary"

        });

        return;

    }


    try {

        const response =
            await fetch(
                `/admin/api/donations/${id}`,
                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name,

                            email,

                            amount

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            await appNotice({

                title:
                    "Update Failed",

                subtitle:
                    "The donation could not be updated.",

                message:
                    data.message ||
                    "Please try again.",

                icon:
                    "❌",

                type:
                    "danger"

            });

            return;

        }


        await appNotice({

            title:
                "Donation Updated",

            subtitle:
                "Your changes have been saved.",

            message:
                "The donation details were updated successfully.",

            icon:
                "✅",

            type:
                "primary"

        });


        await loadDonations();


    } catch (error) {

        console.error(
            "Edit donation error:",
            error
        );


        await appNotice({

            title:
                "Something Went Wrong",

            subtitle:
                "Unable to update the donation.",

            message:
                "Please try again.",

            icon:
                "❌",

            type:
                "danger"

        });

    }

}

document
    .getElementById(
        "addDonationBtn"
    )
    ?.addEventListener(
        "click",
        async () => {

            const result =
                await openAppModal({

                    title:
                        "Add Donation",

                    subtitle:
                        "Enter the donor information.",

                    icon:
                        "💙",

                    body: `

                        <div class="app-modal-field">

                            <label>
                                Donor Name
                            </label>

                            <input
                                id="newDonationName"
                                type="text"
                                placeholder="Enter donor name"
                            >

                        </div>


                        <div class="app-modal-field">

                            <label>
                                Donor Email
                            </label>

                            <input
                                id="newDonationEmail"
                                type="email"
                                placeholder="Enter donor email"
                            >

                        </div>


                        <div class="app-modal-field">

                            <label>
                                Donation Amount
                            </label>

                            <input
                                id="newDonationAmount"
                                type="number"
                                min="1"
                                placeholder="Enter amount"
                            >

                        </div>

                    `,

                    buttons: [

                        {
                            text:
                                "Cancel",

                            type:
                                "cancel",

                            value:
                                null

                        },

                        {
                            text:
                                "Add Donation",

                            type:
                                "primary",

                            value:
                                "add"

                        }

                    ]

                });


            if (
                result !==
                "add"
            ) {

                return;

            }


            const name =
                document
                    .getElementById(
                        "newDonationName"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "newDonationEmail"
                    )
                    .value
                    .trim();


            const amount =
                Number(
                    document
                        .getElementById(
                            "newDonationAmount"
                        )
                        .value
                );


            addDonation(
                name,
                email,
                amount
            );

        }
    );


    async function addDonation(
    name,
    email,
    amount
) {

    name = name.trim();
    email = email.trim();
    amount = Number(amount);

    if (!name) {
        adminAlert("Name cannot be empty.");
        return;
    }

    if (!email) {
        adminAlert("Email cannot be empty.");
        return;
    }

    if (
        !amount ||
        amount <= 0
    ) {
        adminAlert(
            "Enter a valid donation amount."
        );
        return;
    }

    try {

        const response =
            await fetch(
                "/admin/api/donations",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        amount
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            adminAlert(
                data.message ||
                "Failed to add donation."
            );

            return;
        }

        adminAlert(
            "Donation added successfully."
        );

        await loadDonations();

    } catch (error) {

        console.error(
            "Add donation error:",
            error
        );

        adminAlert(
            "Unable to add donation."
        );
    }
}

/* ================= MESSAGES ================= */

async function loadMessages() {

    const container =
        document.getElementById("messagesContent");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading-box">
            Loading messages...
        </div>
    `;

    try {

        const response =
            await fetch("/admin/api/messages");

        if (response.status === 401) {
            window.location.href =
                "/admin/admin.html";
            return;
        }

        const data =
            await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Failed to load messages."
            );
        }

        const messages =
            data.messages || [];

            const searchInput =
    document.getElementById("messageSearch");

const searchTerm =
    searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";

const filteredMessages =
    messages.filter(message => {

        const name =
            (message.name || "")
                .toLowerCase();

        const email =
            (message.email || "")
                .toLowerCase();

        const text =
            (message.message || "")
                .toLowerCase();

        return (
            name.includes(searchTerm) ||
            email.includes(searchTerm) ||
            text.includes(searchTerm)
        );
    });

        const unreadCount =
    messages.filter(
        message => !message.read
    ).length;

const unreadElement =
    document.getElementById(
        "unreadMessagesCount"
    );

if (unreadElement) {
    unreadElement.textContent =
        unreadCount;
}


        if (!messages.length) {

            container.innerHTML = `
                <div class="empty-projects">
                    No messages yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            filteredMessages.map(message => `

                <div
                    class="project-card"
                    style="margin-bottom:15px;"
                >

                    <div class="project-top">

                        <div class="project-name">
                            ${escapeHTML(
                                message.name ||
                                "Unknown"
                            )}
                        </div>

                        <span class="language-badge">
                            ${
                                message.read
                                    ? "Read"
                                    : "Unread"
                            }
                        </span>

                        <button
    class="message-action"
    onclick="toggleMessageRead('${message._id}')"
>
    ${message.read ? "↩ Mark Unread" : "✓ Mark Read"}
</button>


<button
    class="message-action delete"
    onclick="deleteMessage('${message._id}')"
>
    🗑️ Delete
</button>

                    </div>

                    <div
                        style="
                            color:#64748b;
                            margin:8px 0;
                            font-size:13px;
                        "
                    >
                        ${escapeHTML(
                            message.email || ""
                        )}
                    </div>

                    <div
                        style="
                            color:#cbd5e1;
                            line-height:1.6;
                            margin:12px 0;
                        "
                    >
                        ${escapeHTML(
                            message.message || ""
                        )}
                    </div>

                    <div
                        style="
                            color:#64748b;
                            font-size:11px;
                        "
                    >
                        ${
                            message.createdAt
                                ? new Date(
                                    message.createdAt
                                  ).toLocaleString(
                                    "en-IN"
                                  )
                                : ""
                        }
                    </div>

                </div>

            `).join("");

    } catch (error) {

        console.error(
            "Messages error:",
            error
        );

        container.innerHTML = `
            <div class="empty-projects">
                Failed to load messages.
            </div>
        `;
    }
}

document.addEventListener(
    "input",
    function(e) {

        if (e.target.id === "messageSearch") {
            loadMessages();
        }

    }
);

/* ================= TOGGLE MESSAGE READ ================= */

async function toggleMessageRead(id) {

    try {

        const response = await fetch(
            `/admin/api/messages/${id}/read`,
            {
                method: "PUT"
            }
        );

        const data = await response.json();

        if (!data.success) {
            adminAlert(
                data.message ||
                "Failed to update message."
            );
            return;
        }

        loadMessages();

    } catch (error) {

        console.error(
            "Toggle message read error:",
            error
        );

        adminAlert(
            "Failed to update message."
        );
    }
}


/* ================= DELETE MESSAGE ================= */

async function deleteMessage(id) {

    const confirmDelete =
    await appConfirm({

        title:
            "Delete Message?",

        subtitle:
            "This message will be permanently removed.",

        message:
            "Are you sure you want to delete this message?",

        icon:
            "🗑️"

    });

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `/admin/api/messages/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!data.success) {

            await appNotice({

    title:
        "Delete Failed",

    subtitle:
        "The message could not be deleted.",

    message:
        data.message ||
        "Failed to delete message.",

    icon:
        "❌"

});

            return;
        }

        await appNotice({

    title:
        "Message Deleted",

    subtitle:
        "The message has been removed.",

    message:
        "Message deleted successfully.",

    icon:
        "🗑️"

});

        loadMessages();

    } catch (error) {

        console.error(
            "Delete message error:",
            error
        );

        await appNotice({

    title:
        "Something Went Wrong",

    subtitle:
        "The message could not be deleted.",

    message:
        "Please try again.",

    icon:
        "❌"

});
    }
}

/* ================= VISITORS ================= */

async function loadVisitors() {

    try {

        const response =
            await fetch(
                "/admin/visitor-stats"
            );

        const data =
            await response.json();


        const count =
            data.count || 0;


        const visitorStat =
            document.getElementById(
                "visitorStat"
            );

        if (visitorStat) {

            visitorStat.textContent =
                count;

        }


        const visitorBig =
            document.getElementById(
                "visitorBig"
            );

        if (visitorBig) {

            visitorBig.textContent =
                count;

        }


        /* Put current count inside editor */

        const visitorInput =
            document.getElementById(
                "visitorCountInput"
            );

        if (visitorInput) {

            visitorInput.value =
                count;

        }


    } catch (error) {

        console.error(
            "Visitor statistics error:",
            error
        );

    }

}


/* ================= WEBSITE SETTINGS ================= */

async function loadSettings() {

    try {

        const response =
            await fetch("/admin/api/settings");

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        const settings =
            data.settings;

        document.getElementById(
            "settingSiteTitle"
        ).value =
            settings.siteTitle || "";

        document.getElementById(
            "settingSiteDescription"
        ).value =
            settings.siteDescription || "";

        document.getElementById(
            "settingContactEmail"
        ).value =
            settings.contactEmail || "";

        document.getElementById(
            "settingInstagram"
        ).value =
            settings.instagram || "";

        document.getElementById(
            "settingGithub"
        ).value =
            settings.github || "";

        document.getElementById(
            "settingLinkedin"
        ).value =
            settings.linkedin || "";


            const profilePreview =
    document.getElementById(
        "profileImagePreview"
    );

if (profilePreview) {

    profilePreview.src =
        settings.profileImage ||
        "/images/photoweb.jpg";

}

    } catch (error) {

        console.error(
            "Settings Load Error:",
            error
        );

    }

}


/* ================= SAVE WEBSITE SETTINGS ================= */

document
    .getElementById("saveSettingsBtn")
    .addEventListener(
        "click",
        async () => {

            const settings = {

                siteTitle:
                    document.getElementById(
                        "settingSiteTitle"
                    ).value.trim(),

                siteDescription:
                    document.getElementById(
                        "settingSiteDescription"
                    ).value.trim(),

                contactEmail:
                    document.getElementById(
                        "settingContactEmail"
                    ).value.trim(),

                instagram:
                    document.getElementById(
                        "settingInstagram"
                    ).value.trim(),

                github:
                    document.getElementById(
                        "settingGithub"
                    ).value.trim(),

                linkedin:
                    document.getElementById(
                        "settingLinkedin"
                    ).value.trim()

            };


            try {

                const response =
                    await fetch(
                        "/admin/api/settings",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    settings
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok ||
                    !data.success) {

                    adminAlert(
                        data.message ||
                        "Failed to save settings."
                    );

                    return;
                }


                await appNotice({

    title:
        "Settings Updated",

    subtitle:
        "Your website changes have been saved.",

    message:
        "Settings saved successfully!",

    icon:
        "✅"

});


            } catch (error) {

                console.error(
                    "Settings Save Error:",
                    error
                );

                await appNotice({
    title: "Settings Update Failed",
    subtitle: "Something went wrong while saving.",
    message: "Failed to save settings.",
    icon: "❌"
});

            }

        }
    );


/* =====================================================
   HOMEPAGE EDITOR
===================================================== */

async function loadHomepageEditor() {

    const editor =
        document.getElementById(
            "homepageHtmlEditor"
        );

    const message =
        document.getElementById(
            "homepageEditorMessage"
        );

    if (!editor) return;

    try {

        message.textContent =
            "Loading homepage...";

        const response =
            await fetch(
                "/admin/api/homepage"
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load homepage."
            );
        }

        editor.value =
            data.homepage.html || "";

        message.textContent =
            "✅ Homepage loaded.";

    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ " + error.message;
    }
}


/* =====================================================
   SAVE HOMEPAGE
===================================================== */

async function saveHomepageEditor() {

    const editor =
        document.getElementById(
            "homepageHtmlEditor"
        );

    const message =
        document.getElementById(
            "homepageEditorMessage"
        );

    if (!editor) return;

    const html =
        editor.value;

    if (!html.trim()) {

        adminAlert(
            "Homepage HTML cannot be empty."
        );

        return;
    }

    const confirmed =
        await appConfirm({

            title:
                "Save Homepage Changes?",

            subtitle:
                "These changes will update your live homepage.",

            message:
                "Are you sure you want to save these changes?",

            icon:
                "🌐",

            danger:
                false

        });

    if (!confirmed) {

        return;
    }

    try {

        message.textContent =
            "Saving homepage...";

        const response =
            await fetch(
                "/admin/api/homepage",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            html: html
                        })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to save homepage."
            );
        }

        message.textContent =
            "✅ Homepage saved successfully.";

        await appNotice({

    title:
        "Homepage Updated",

    subtitle:
        "Your website changes have been saved.",

    message:
        "Website changes saved successfully.",

    icon:
        "✅"

});

    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ " + error.message;
    }
}


/* =====================================================
   PROFILE IMAGE UPLOAD
===================================================== */

async function uploadProfileImage() {

    const input =
        document.getElementById(
            "profileImageInput"
        );

    const preview =
        document.getElementById(
            "profileImagePreview"
        );

    const message =
        document.getElementById(
            "profileImageMessage"
        );

    const button =
        document.getElementById(
            "uploadProfileImageBtn"
        );

    if (
        !input ||
        !input.files ||
        !input.files[0]
    ) {

        await appNotice({

    title:
        "Select an Image",

    subtitle:
        "No profile picture was selected.",

    message:
        "Please select a profile picture first.",

    icon:
        "⚠️"

});

        return;
    }

    const file =
        input.files[0];

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        await appNotice({

    title:
        "Invalid File",

    subtitle:
        "The selected file is not an image.",

    message:
        "Please select a JPG, PNG, WEBP, or other valid image file.",

    icon:
        "⚠️"

});

        return;
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        await appNotice({

    title:
        "Image Too Large",

    subtitle:
        "The profile picture exceeds the size limit.",

    message:
        "Please select an image smaller than 10 MB.",

    icon:
        "⚠️"

});

        return;
    }

    const formData =
        new FormData();

    formData.append(
        "image",
        file
    );

    try {

        button.disabled =
            true;

        button.textContent =
            "Uploading...";

        message.textContent =
            "Uploading profile picture...";

        const response =
            await fetch(
                "/admin/api/profile-image",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Profile picture upload failed."
            );
        }

        preview.src =
            data.imageUrl +
            "?v=" +
            Date.now();

        input.value = "";

        message.textContent =
            "✅ Profile picture updated successfully.";

        await appNotice({

    title:
        "Profile Picture Updated",

    subtitle:
        "Your new profile picture has been uploaded.",

    message:
        "Profile picture updated successfully.",

    icon:
        "🖼️"

});

    } catch (error) {

        console.error(error);

        message.textContent =
            "❌ " + error.message;

            await appNotice({

    title:
        "Upload Failed",

    subtitle:
        "The profile picture could not be uploaded.",

    message:
        error.message ||
        "Please try again.",

    icon:
        "❌"

});

    } finally {

        button.disabled =
            false;

        button.textContent =
            "📤 Upload Profile Picture";
    }
}


/* =====================================================
   BUTTON EVENTS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const saveHomepageBtn =
            document.getElementById(
                "saveHomepageBtn"
            );

        const loadHomepageBtn =
            document.getElementById(
                "loadHomepageBtn"
            );

        const uploadProfileImageBtn =
            document.getElementById(
                "uploadProfileImageBtn"
            );


        if (saveHomepageBtn) {

            saveHomepageBtn.addEventListener(
                "click",
                saveHomepageEditor
            );
        }


        if (loadHomepageBtn) {

            loadHomepageBtn.addEventListener(
                "click",
                loadHomepageEditor
            );
        }


        if (uploadProfileImageBtn) {

            uploadProfileImageBtn.addEventListener(
                "click",
                uploadProfileImage
            );
        }

        const deleteProfileImageBtn =
    document.getElementById(
        "deleteProfileImageBtn"
    );

if (deleteProfileImageBtn) {

    deleteProfileImageBtn.addEventListener(
        "click",
        deleteProfileImage
    );

}

const saveVisitorCountBtn =
    document.getElementById(
        "saveVisitorCountBtn"
    );

if (saveVisitorCountBtn) {

    saveVisitorCountBtn.addEventListener(
        "click",
        saveVisitorCount
    );

}

    }
);


/* =====================================================
   SAVE WEBSITE BUILDER
===================================================== */

async function saveWebsiteBuilder() {

    if (!websiteContent || !websiteBuilderLoaded) {

        await loadWebsiteBuilder();

        if (!websiteContent || !websiteBuilderLoaded) {
            adminAlert("Website Builder could not load your saved content. Please check your admin connection and try again.");
            return;
        }

    }


    /* ================= UPDATE HERO ================= */

    websiteContent.hero = {

        name:
            document.getElementById(
                "builderHeroName"
            ).value,

        typing:
            document.getElementById(
                "builderHeroTyping"
            ).value,

        tagline:
            document.getElementById(
                "builderHeroTagline"
            ).value

    };


    /* ================= UPDATE EDUCATION ================= */

    document
        .querySelectorAll(
            "[data-education-title]"
        )
        .forEach(input => {

            const index =
                Number(
                    input.dataset
                        .educationTitle
                );

            websiteContent
                .education[index]
                .title =
                input.value;

        });


    document
        .querySelectorAll(
            "[data-education-institute]"
        )
        .forEach(input => {

            const index =
                Number(
                    input.dataset
                        .educationInstitute
                );

            websiteContent
                .education[index]
                .institute =
                input.value;

        });


    document
        .querySelectorAll(
            "[data-education-status]"
        )
        .forEach(input => {

            const index =
                Number(
                    input.dataset
                        .educationStatus
                );

            websiteContent
                .education[index]
                .status =
                input.value;

        });


    /* ================= UPDATE SKILLS ================= */

    document
        .querySelectorAll(
            "[data-skill-index]"
        )
        .forEach(input => {

            const index =
                Number(
                    input.dataset
                        .skillIndex
                );

            websiteContent.skills[index] =
                input.value;

        });


    /* ================= UPDATE PROGRESS SKILLS ================= */

    document
        .querySelectorAll(
            "[data-progress-name]"
        )
        .forEach(input => {

            const index =
                Number(
                    input.dataset
                        .progressName
                );

            websiteContent
                .progressSkills[index]
                .name =
                input.value;

        });


    document
        .querySelectorAll(
            "[data-progress-percentage]"
        )
        .forEach(input => {

            const index =
                Number(
                    input.dataset
                        .progressPercentage
                );

            let percentage =
                Number(
                    input.value
                );

            percentage =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percentage
                    )
                );

            websiteContent
                .progressSkills[index]
                .percentage =
                percentage;

        });


    /* ================= COUNTERS ================= */

    websiteContent.counters = {

        problemsSolved:
            Number(
                document.getElementById(
                    "builderProblemsSolved"
                ).value
            ) || 0,

        problemsLabel:
            document.getElementById(
                "builderProblemsLabel"
            ).value,

        yearsLabel:
            document.getElementById(
                "builderYearsLabel"
            ).value,

        projectsLabel:
            document.getElementById(
                "builderProjectsLabel"
            ).value,

        hoursLabel:
            document.getElementById(
                "builderHoursLabel"
            ).value,

        startDate:
            document.getElementById(
                "builderStartDate"
            ).value

    };


    /* ================= ABOUT ================= */

    websiteContent.about = {

        title:
            document.getElementById(
                "builderAboutTitle"
            ).value,

        text:
            document.getElementById(
                "builderAboutText"
            ).value

    };


    /* ================= CONTACT ================= */

    websiteContent.contact = {

        title:
            document.getElementById(
                "builderContactTitle"
            ).value,

        namePlaceholder:
            document.getElementById(
                "builderContactName"
            ).value,

        emailPlaceholder:
            document.getElementById(
                "builderContactEmail"
            ).value,

        messagePlaceholder:
            document.getElementById(
                "builderContactMessage"
            ).value,

        buttonText:
            document.getElementById(
                "builderContactButton"
            ).value

    };


    /* ================= DONATION ================= */

    websiteContent.donation = {

        title:
            document.getElementById(
                "builderDonationTitle"
            ).value,

        goal:
            Number(
                document.getElementById(
                    "builderDonationGoal"
                ).value
            ) || 0,

        donorNamePlaceholder:
            document.getElementById(
                "builderDonationName"
            ).value,

        donorEmailPlaceholder:
            document.getElementById(
                "builderDonationEmail"
            ).value,

        customAmountPlaceholder:
            document.getElementById(
                "builderDonationCustom"
            ).value,

        buttonText:
            document.getElementById(
                "builderDonationButton"
            ).value,

        leaderboardTitle:
            document.getElementById(
                "builderLeaderboardTitle"
            ).value,

        milestoneTitle:
            document.getElementById(
                "builderMilestoneTitle"
            ).value

    };


    /* ================= THANK YOU ================= */

    websiteContent.thankYou = {

        title:
            document.getElementById(
                "builderThankYouTitle"
            ).value

    };


    /* ================= SEND TO SERVER ================= */

    const message =
        document.getElementById(
            "websiteBuilderMessage"
        );

    const button =
        document.getElementById(
            "saveWebsiteBuilderBtn"
        );


    try {

        button.disabled =
            true;

        button.textContent =
            "Saving...";

        message.textContent =
            "Saving website changes...";


        const response =
            await fetch(
                "/admin/api/portfolio-content",
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            websiteContent
                        )

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to save changes."
            );

        }


        message.textContent =
            "✅ Website updated successfully!";

        await appNotice({
            title: "Website Updated",
            subtitle: "Your website changes have been saved.",
            message: "Website changes saved successfully!",
            icon: "✅",
            type: "primary"
        });


    } catch (error) {

        console.error(
            "Website Builder Save Error:",
            error
        );

        message.textContent =
            "❌ " + error.message;


    } finally {

        button.disabled =
            false;

        button.textContent =
            "💾 SAVE ALL WEBSITE CHANGES";

    }

}


function initWebsiteBuilderControls() {

    const saveButton = document.getElementById("saveWebsiteBuilderBtn");

    if (saveButton && !saveButton.dataset.bound) {
        saveButton.dataset.bound = "true";
        saveButton.addEventListener("click", saveWebsiteBuilder);
    }

}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWebsiteBuilderControls);
} else {
    initWebsiteBuilderControls();
}


/* =====================================================
   WEBSITE BUILDER
===================================================== */

let websiteContent = null;
let websiteBuilderLoaded = false;


/* ================= LOAD WEBSITE BUILDER ================= */

async function loadWebsiteBuilder() {

    const message =
        document.getElementById("websiteBuilderMessage");

    try {

        if (message) message.textContent = "Loading website content...";

        const response = await fetch("/admin/api/portfolio-content", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        if (response.status === 401) {
            window.location.href = "/admin/admin.html";
            return;
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load website content.");
        }

        websiteContent = data.content || {};

        // Always provide safe defaults so the builder works even on an empty/new database.
        websiteContent.hero ||= { name: "", typing: "", tagline: "" };
        websiteContent.education ||= [];
        websiteContent.counters ||= {};
        websiteContent.skills ||= [];
        websiteContent.progressSkills ||= [];
        websiteContent.about ||= { title: "", text: "" };
        websiteContent.contact ||= {};
        websiteContent.donation ||= {};
        websiteContent.thankYou ||= { title: "" };

        fillWebsiteBuilder();
        websiteBuilderLoaded = true;

        if (message) message.textContent = "Website content loaded.";

    } catch (error) {

        console.error("Website Builder Load Error:", error);

        if (message) {
            message.textContent = "❌ " + (error.message || "Unable to load website builder.");
        }

    }

}


/* ================= FILL BUILDER ================= */

function fillWebsiteBuilder() {

    if (!websiteContent) {
        return;
    }


    /* HERO */

    document.getElementById(
        "builderHeroName"
    ).value =
        websiteContent.hero?.name || "";


    document.getElementById(
        "builderHeroTyping"
    ).value =
        websiteContent.hero?.typing || "";


    document.getElementById(
        "builderHeroTagline"
    ).value =
        websiteContent.hero?.tagline || "";


    /* COUNTERS */

    document.getElementById(
        "builderProblemsSolved"
    ).value =
        websiteContent.counters?.problemsSolved || 0;


    document.getElementById(
        "builderProblemsLabel"
    ).value =
        websiteContent.counters?.problemsLabel || "";


    document.getElementById(
        "builderYearsLabel"
    ).value =
        websiteContent.counters?.yearsLabel || "";


    document.getElementById(
        "builderProjectsLabel"
    ).value =
        websiteContent.counters?.projectsLabel || "";


    document.getElementById(
        "builderHoursLabel"
    ).value =
        websiteContent.counters?.hoursLabel || "";


    document.getElementById(
        "builderStartDate"
    ).value =
        websiteContent.counters?.startDate || "";


    /* ABOUT */

    document.getElementById(
        "builderAboutTitle"
    ).value =
        websiteContent.about?.title || "";


    document.getElementById(
        "builderAboutText"
    ).value =
        websiteContent.about?.text || "";


    /* THANK YOU */

    document.getElementById(
        "builderThankYouTitle"
    ).value =
        websiteContent.thankYou?.title || "";


    /* CONTACT */

    document.getElementById(
        "builderContactTitle"
    ).value =
        websiteContent.contact?.title || "";


    document.getElementById(
        "builderContactName"
    ).value =
        websiteContent.contact?.namePlaceholder || "";


    document.getElementById(
        "builderContactEmail"
    ).value =
        websiteContent.contact?.emailPlaceholder || "";


    document.getElementById(
        "builderContactMessage"
    ).value =
        websiteContent.contact?.messagePlaceholder || "";


    document.getElementById(
        "builderContactButton"
    ).value =
        websiteContent.contact?.buttonText || "";


    /* DONATION */

    document.getElementById(
        "builderDonationTitle"
    ).value =
        websiteContent.donation?.title || "";


    document.getElementById(
        "builderDonationGoal"
    ).value =
        websiteContent.donation?.goal || 10000;


    document.getElementById(
        "builderDonationName"
    ).value =
        websiteContent.donation?.donorNamePlaceholder || "";


    document.getElementById(
        "builderDonationEmail"
    ).value =
        websiteContent.donation?.donorEmailPlaceholder || "";


    document.getElementById(
        "builderDonationCustom"
    ).value =
        websiteContent.donation?.customAmountPlaceholder || "";


    document.getElementById(
        "builderDonationButton"
    ).value =
        websiteContent.donation?.buttonText || "";


    document.getElementById(
        "builderLeaderboardTitle"
    ).value =
        websiteContent.donation?.leaderboardTitle || "";


    document.getElementById(
        "builderMilestoneTitle"
    ).value =
        websiteContent.donation?.milestoneTitle || "";


    /* DYNAMIC LISTS */

    renderEducation();

    renderSkills();

    renderProgressSkills();

}




/* ================= EDUCATION EDITOR ================= */

function renderEducation() {

    const container =
        document.getElementById(
            "educationEditor"
        );

    if (!container) return;

    const education =
        websiteContent.education || [];

    container.innerHTML =
        education.map((item, index) => `

            <div class="builder-row">

                <input
                    type="text"
                    placeholder="Education title"
                    value="${escapeHTML(item.title || "")}"
                    data-education-title="${index}"
                >

                <input
                    type="text"
                    placeholder="Institute"
                    value="${escapeHTML(item.institute || "")}"
                    data-education-institute="${index}"
                >

                <input
                    type="text"
                    placeholder="Status"
                    value="${escapeHTML(item.status || "")}"
                    data-education-status="${index}"
                >

                <button
                    type="button"
                    class="builder-remove"
                    onclick="removeEducation(${index})"
                >
                    🗑
                </button>

            </div>

        `).join("");
}


/* ================= ADD EDUCATION ================= */

function addEducation() {

    if (!websiteContent.education) {

        websiteContent.education = [];

    }

    websiteContent.education.push({

        title: "New Education",

        institute: "Institute Name",

        status: "Status"

    });

    renderEducation();

}


/* ================= REMOVE EDUCATION ================= */

function removeEducation(index) {

    if (!websiteContent.education) {
        return;
    }

    websiteContent.education.splice(
        index,
        1
    );

    renderEducation();

}


/* ================= SKILLS EDITOR ================= */

function renderSkills() {

    const container =
        document.getElementById(
            "skillsEditor"
        );

    if (!container) return;

    const skills =
        websiteContent.skills || [];

    container.innerHTML =
        skills.map((skill, index) => `

            <div class="skill-builder-row">

                <input
                    type="text"
                    value="${escapeHTML(skill || "")}"
                    placeholder="Skill name"
                    data-skill-index="${index}"
                >

                <button
                    type="button"
                    class="builder-remove"
                    onclick="removeSkill(${index})"
                >
                    🗑
                </button>

            </div>

        `).join("");
}


/* ================= ADD SKILL ================= */

function addSkill() {

    if (!websiteContent.skills) {

        websiteContent.skills = [];

    }

    websiteContent.skills.push(
        "New Skill"
    );

    renderSkills();

}


/* ================= REMOVE SKILL ================= */

function removeSkill(index) {

    if (!websiteContent.skills) {
        return;
    }

    websiteContent.skills.splice(
        index,
        1
    );

    renderSkills();

}


/* ================= SKILL PERCENTAGE ================= */

function renderProgressSkills() {

    const container =
        document.getElementById(
            "progressSkillsEditor"
        );

    if (!container) return;

    const skills =
        websiteContent.progressSkills || [];

    container.innerHTML =
        skills.map((skill, index) => `

            <div class="skill-builder-row">

                <input
                    type="text"
                    value="${escapeHTML(skill.name || "")}"
                    placeholder="Skill name"
                    data-progress-name="${index}"
                >

                <input
                    type="number"
                    min="0"
                    max="100"
                    value="${Number(skill.percentage) || 0}"
                    placeholder="Percentage"
                    data-progress-percentage="${index}"
                >

                <button
                    type="button"
                    class="builder-remove"
                    onclick="removeProgressSkill(${index})"
                >
                    🗑
                </button>

            </div>

        `).join("");
}


/* ================= ADD PROGRESS SKILL ================= */

function addProgressSkill() {

    if (!websiteContent.progressSkills) {

        websiteContent.progressSkills = [];

    }

    websiteContent.progressSkills.push({

        name: "New Skill",

        percentage: 50

    });

    renderProgressSkills();

}


/* ================= REMOVE PROGRESS SKILL ================= */

function removeProgressSkill(index) {

    if (!websiteContent.progressSkills) {
        return;
    }

    websiteContent.progressSkills.splice(
        index,
        1
    );

    renderProgressSkills();

}




/* ================= WEBSITE BUILDER BUTTONS ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "addEducationBtn"
            )
            ?.addEventListener(
                "click",
                addEducation
            );


        document
            .getElementById(
                "addSkillBtn"
            )
            ?.addEventListener(
                "click",
                addSkill
            );


        document
            .getElementById(
                "addProgressSkillBtn"
            )
            ?.addEventListener(
                "click",
                addProgressSkill
            );

    }
);


/* =====================================================
   DELETE PROFILE IMAGE
===================================================== */

async function deleteProfileImage() {

    const confirmed =
    await appConfirm({

        title:
            "Delete Profile Picture?",

        subtitle:
            "Your current profile picture will be removed.",

        message:
            "The website will return to the default profile picture.",

        icon:
            "🖼️"

    });

    if (!confirmed) {
        return;
    }


    const button =
        document.getElementById(
            "deleteProfileImageBtn"
        );

    const preview =
        document.getElementById(
            "profileImagePreview"
        );

    const message =
        document.getElementById(
            "profileImageMessage"
        );


    try {

        button.disabled = true;

        button.textContent =
            "Deleting...";

        message.textContent =
            "Deleting profile picture...";


        const response =
            await fetch(
                "/admin/api/profile-image",
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to delete profile picture."
            );

        }


        preview.src =
            "/images/photoweb.jpg?v=" +
            Date.now();


        message.textContent =
            "✅ Profile picture deleted successfully.";

        await appNotice({

    title:
        "Delete Profile Picture",

    subtitle:
        "The profile picture has been deleted.",

    message:
        "Profile picture deleted.",

    icon:
        "✅"

});


    } catch (error) {

        console.error(
            "Profile Image Delete Error:",
            error
        );

        message.textContent =
            "❌ " + error.message;


    } finally {

        button.disabled =
            false;

        button.textContent =
            "🗑️ Delete Picture";

    }

}



/* =====================================================
   SAVE VISITOR COUNT
===================================================== */

async function saveVisitorCount() {

    const input =
        document.getElementById(
            "visitorCountInput"
        );

    const message =
        document.getElementById(
            "visitorEditMessage"
        );

    const button =
        document.getElementById(
            "saveVisitorCountBtn"
        );


    if (!input) {
        return;
    }


    const count =
        Number(input.value);


    if (
        !Number.isInteger(count) ||
        count < 0
    ) {

        message.textContent =
            "❌ Enter a valid visitor count.";

        return;

    }


    try {

        button.disabled = true;

        button.textContent =
            "Saving...";

        message.textContent =
            "Updating visitor count...";


        const response =
            await fetch(
                "/admin/visitor-count",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            count: count
                        })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to update visitor count."
            );

        }


        /* Update dashboard immediately */

        const visitorStat =
            document.getElementById(
                "visitorStat"
            );

        if (visitorStat) {

            visitorStat.textContent =
                data.count;

        }


        const visitorBig =
            document.getElementById(
                "visitorBig"
            );

        if (visitorBig) {

            visitorBig.textContent =
                data.count;

        }


        message.textContent =
            "✅ Visitor count updated successfully.";

        await appNotice({

    title:
        "Visitor Count Updated",

    subtitle:
        "Your website visitor count has been updated.",

    message:
        "Visitor count updated successfully."  + data.count,

    icon:
        "👥"

});


    } catch (error) {

        console.error(
            "Save visitor count error:",
            error
        );

        message.textContent =
            "❌ " + error.message;


    } finally {

        button.disabled =
            false;

        button.textContent =
            "💾 Save Count";

    }

}



/* ================= INITIAL DATA ================= */

async function loadDashboardData() {

    await loadProjects();

    await loadDonations();

    await loadVisitors();

    await loadGallery();

}


/* ================= LOGOUT ================= */

document
    .getElementById("logout")
    .addEventListener("click", async () => {

        try {

            await fetch(
                "/admin/logout",
                {
                    method: "POST"
                }
            );

        } finally {

            window.location.href =
                "/admin/admin.html";

        }

    });


/* ================= HTML SECURITY ================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ================= START ================= */

(async () => {

    const loggedIn =
        await checkAdmin();

    if (loggedIn) {

        await loadDashboardData();
        initWebsiteBuilderControls();

    }

})();

/* =====================================================
   PROFESSIONAL MODAL SYSTEM
===================================================== */

let appModalResolver = null;


/* ================= OPEN MODAL ================= */

function openAppModal({

    title = "Confirmation",

    subtitle = "",

    icon = "✨",

    body = "",

    buttons = []

} = {}) {

    const overlay =
        document.getElementById(
            "appModalOverlay"
        );

    const titleElement =
        document.getElementById(
            "appModalTitle"
        );

    const subtitleElement =
        document.getElementById(
            "appModalSubtitle"
        );

    const iconElement =
        document.getElementById(
            "appModalIcon"
        );

    const bodyElement =
        document.getElementById(
            "appModalBody"
        );

    const actionsElement =
        document.getElementById(
            "appModalActions"
        );


    if (!overlay) {

        console.error(
            "Professional modal HTML not found."
        );

        return Promise.resolve(
            null
        );

    }


    titleElement.textContent =
        title;

    subtitleElement.textContent =
        subtitle;

    iconElement.textContent =
        icon;

    bodyElement.innerHTML =
        body;

    actionsElement.innerHTML =
        "";


    return new Promise(resolve => {

        appModalResolver =
            resolve;


        buttons.forEach(button => {

            const element =
                document.createElement(
                    "button"
                );

            element.type =
                "button";

            element.className =
                "app-modal-btn " +
                (
                    button.type ||
                    "primary"
                );

            element.textContent =
                button.text;


            element.addEventListener(
                "click",
                () => {

                    closeAppModal(
                        button.value
                    );

                }
            );


            actionsElement
                .appendChild(element);

        });


        overlay.classList.add(
            "active"
        );

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );


        setTimeout(() => {

            const firstInput =
                bodyElement.querySelector(
                    "input, textarea, select"
                );

            if (firstInput) {

                firstInput.focus();

                if (
                    firstInput.select
                ) {

                    firstInput.select();

                }

            }

        }, 100);

    });

}


/* ================= CLOSE MODAL ================= */

function closeAppModal(value = null) {

    const overlay =
        document.getElementById(
            "appModalOverlay"
        );

    if (!overlay) {
        return;
    }


    overlay.classList.remove(
        "active"
    );

    overlay.setAttribute(
        "aria-hidden",
        "true"
    );


    if (appModalResolver) {

        const resolve =
            appModalResolver;

        appModalResolver =
            null;

        resolve(value);

    }

}


/* ================= CLOSE BUTTON ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeButton =
            document.getElementById(
                "appModalClose"
            );

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => {

                    closeAppModal(
                        null
                    );

                }
            );

        }


        const overlay =
            document.getElementById(
                "appModalOverlay"
            );

        if (overlay) {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        closeAppModal(
                            null
                        );

                    }

                }
            );

        }

    }
);


/* ================= CUSTOM PROMPT ================= */

function appPrompt({

    title = "Enter Information",

    subtitle = "Please enter the required information.",

    label = "Value",

    value = "",

    placeholder = "",

    type = "text",

    icon = "✏️"

} = {}) {

    const inputId =
        "appModalInput_" +
        Date.now();


    const body = `

        <div class="app-modal-field">

            <label for="${inputId}">
                ${escapeHTML(label)}
            </label>

            <input
                id="${inputId}"
                type="${type}"
                value="${escapeHTML(
                    String(value)
                )}"
                placeholder="${escapeHTML(
                    placeholder
                )}"
                autocomplete="off"
            >

        </div>

    `;


    return openAppModal({

        title,

        subtitle,

        icon,

        body,

        buttons: [

            {
                text: "Cancel",
                type: "cancel",
                value: null
            },

            {
                text: "Continue",
                type: "primary",
                value: "submit"
            }

        ]

    }).then(result => {

        if (
            result !==
            "submit"
        ) {

            return null;

        }


        const input =
            document.getElementById(
                inputId
            );

        return input
            ? input.value
            : "";

    });

}


/* ================= DASHBOARD ALERT REPLACEMENT ================= */

function adminAlert(message) {

    const text =
        String(message || "");

    const isError =
        /failed|unable|cannot|invalid|error|not found|required|empty/i
            .test(text);

    return appNotice({

        title:
            isError
                ? "Action Required"
                : "Success",

        subtitle:
            isError
                ? "Please review the information below."
                : "The operation completed successfully.",

        message:
            text,

        icon:
            isError
                ? "⚠️"
                : "✅",

        type:
            isError
                ? "danger"
                : "primary"

    });

}


/* ================= CUSTOM CONFIRM ================= */

function appConfirm({

    title = "Are you sure?",

    subtitle =
        "This action cannot be undone.",

    message = "",

    icon = "⚠️",

    danger = true

} = {}) {

    return openAppModal({

        title,

        subtitle,

        icon,

        body: `

            <div class="app-modal-message">

                ${escapeHTML(
                    message
                )}

            </div>

        `,

        buttons: [

            {
                text: "Cancel",

                type: "cancel",

                value: false

            },

            {
                text:
                    danger
                        ? "Delete"
                        : "Continue",

                type:
                    danger
                        ? "danger"
                        : "primary",

                value: true

            }

        ]

    }).then(
        result => result === true
    );

}


/* ================= CUSTOM NOTICE ================= */

function appNotice({

    title = "Done",

    subtitle = "",

    message = "",

    icon = "✅",

    type = "primary"

} = {}) {

    return openAppModal({

        title,

        subtitle,

        icon,

        body: `

            <div class="app-modal-message">

                ${escapeHTML(
                    message
                )}

            </div>

        `,

        buttons: [

            {
                text: "OK",

                type,

                value: true

            }

        ]

    });

}