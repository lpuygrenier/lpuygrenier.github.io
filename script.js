function showSection(sectionId) {
    // Hide all sections
    var sections = document.querySelectorAll('.page-section');
    sections.forEach(function (section) {
        section.style.display = 'none';
    });

    // Show the selected section
    var selectedSection = document.getElementById(sectionId + 'Section');
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    toggleMenu();
}

function toggleMenu() {
    var menu = document.querySelector('#navbar ul');
    menu.classList.toggle('show');
}

showSection('home');
toggleMenu();