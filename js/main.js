window.addEventListener('DOMContentLoaded', () => {

    const reportsMain = () => {
        const textForm = document.querySelector('.js-text-form');
        const textInput = document.querySelector('.js-text-form input');
        const selectInput = document.querySelector('.js-select-year');
        const tagsInput = document.querySelector('.js-tags');
        const resultsWrap = document.querySelector('.js-results')
        let dataObj = [];
        const filters = {
            term: '',
            activeTags: [],
            selectedYear: null,
        }

        const createCustomElement = (params) => {
            element = document.createElement(params.element)
            if (params.classListArray) {
                params.classListArray.forEach(item => {
                    element.classList.add(item)
                })
            }
            if (params.attributesArray) {
                params.attributesArray.forEach(attr => {
                    element.setAttribute(attr.name, attr.value)
                })
            }

            element.textContent = params.text
            return element
        }
        const createDownloadLink = (file) => {
            const listElement = createCustomElement({
                element: 'li',
                classListArray: ['l-results__file'],
            });
            const linkElement = createCustomElement({
                element: 'a',
                classListArray: ['l-results__report-link'],
                attributesArray: [{
                        name: 'href',
                        value: '#'
                    },
                    {
                        name: 'download',
                        value: file.filename
                    }
                ],
                text: `${file.filename} (${file.filesize}kB)`
            });
            listElement.append(linkElement)
            return listElement
        }
        const appendChildrens = (parent, elements) => {
            elements.forEach(el => {
                parent.append(el)
            })
            return parent
        }

        const setAccordion = (filesArray) => {
            const linksAccordionWrap = createCustomElement({
                element: 'div',
                classListArray: ['l-results__files-wrap'],
            });
            const expandAccordionButton = createCustomElement({
                element: 'a',
                classListArray: ['l-results__report-link', 'l-results__expand-files'],
                attributesArray: [{
                    name: 'href',
                    value: 'javascript:;'
                }],
                text: `Pliki do pobrania (${filesArray.length})`
            });
            const arrowIcon = createCustomElement({
                element: 'span',
                classListArray: ['material-icons', 'l-results__expand-more-icon'],
                text: 'expand_more'
            });
            expandAccordionButton.append(arrowIcon)
            const filesWrap = createCustomElement({
                element: 'ul',
                classListArray: ['l-results__files-list', 'js-files-list'],
            });
            filesArray.forEach(file => {
                filesWrap.append(createDownloadLink(file))
            })
            expandAccordionButton.addEventListener('click', event => {
                event.preventDefault()
                filesWrap.classList.toggle('l-results__files-list--visible')
                if (filesWrap.style.maxHeight) {
                    filesWrap.style.maxHeight = null
                } else {
                    filesWrap.style.maxHeight = filesWrap.scrollHeight + "px"
                }
                arrowIcon.classList.toggle('l-results__expand-more-icon--close')
            })
            appendChildrens(linksAccordionWrap, [expandAccordionButton, filesWrap])
            return linksAccordionWrap
        };

        const fetchData = async () => {
            let response = await fetch('./data/data.json')
            dataObj = await response.json()
        };

        const checkActiveTags = (tagName) => {
            if (filters.activeTags.indexOf(tagName) !== -1) {
                filters.activeTags.splice(filters.activeTags.indexOf(tagName), filters.activeTags.indexOf(tagName) + 1)
            } else {
                filters.activeTags.push(tagName)
            }
            filters.activeTags.forEach((el) => {
                document.querySelector(`.l-filters__tags-checkbox input[name=${el}]`).checked = true
            })
            renderResults()
        }
        const initFilters = () => {
            const setYearsSelect = () => {
                const years = [...new Set(dataObj.map((item) => {
                    return new Date(item.date).getFullYear();
                }).sort().reverse())]
                filters.selectedYear = years[0]
                selectInput.textContent = ''
                years.forEach(item => {
                    let optionElement = createCustomElement({
                        element: 'option',
                        attributesArray: [{
                            name: 'value',
                            value: item
                        }, ],
                        text: item.toString()
                    });
                    selectInput.append(optionElement)
                })
                selectInput.addEventListener('change', (event) => {
                    filters.selectedYear = event.currentTarget.value;
                    renderResults()
                })
            }
            const setTags = () => {
                const categories = [...new Set(dataObj.map((item) => {
                    return item.category
                }).sort())]
                categories.unshift('Wszystkie')
                categories.forEach(item => {
                    const childrensArray = []
                    // let label = document.createCustomElement("label", ['l-filters__tags-checkbox']);
                    let label = createCustomElement({
                        element: 'label',
                        classListArray: ['l-filters__tags-checkbox'],
                    });
                    let input = createCustomElement({
                        element: 'input',
                        attributesArray: [{
                                name: 'type',
                                value: 'checkbox'
                            },
                            {
                                name: 'name',
                                value: item
                            }
                        ]
                    });
                    input.addEventListener("click", event => {
                        checkActiveTags(event.currentTarget.getAttribute('name'))
                    })
                    let innerLabel = createCustomElement({
                        element: 'span',
                        classListArray: ['l-filters__tags-checkbox-label'],
                        text: item
                    });
                    let checkMark = createCustomElement({
                        element: 'span',
                        classListArray: ['l-filters__tags-checkbox-checkmark'],
                    });
                    childrensArray.push(input, innerLabel, checkMark)
                    label = appendChildrens(label, childrensArray)
                    tagsInput.append(label)
                })
            }
            const setTextForm = () => {
                textInput.value = ''
                textInput.addEventListener("change", event => {
                    filters.term = event.currentTarget.value
                })
                textForm.addEventListener("submit", event => {
                    event.preventDefault()
                    renderResults()
                })
            }
            setYearsSelect()
            setTags()
            setTextForm()
        };
        const filterResults = () => {
            const filteredByYear = dataObj.filter(item => {
                return new Date(item.date).getFullYear() === +filters.selectedYear
            })
            let filteredByTags = []
            if (filters.activeTags.length === 1 && filters.activeTags[0] === "Wszystkie") {
                filteredByTags = filteredByYear
            } else if (filters.activeTags.length === 0) {
                return filteredByTags
            } else {
                filteredByTags = filteredByYear.filter(item => {
                    const tempArray = []
                    filters.activeTags.forEach(activeTag => {
                        if (activeTag === item.category) {
                            tempArray.push(item)
                        }
                    })
                    if (tempArray.length) return true
                    else return false
                })
            }
            const filteredByTerm = filteredByTags.filter(item => {
                // Case sensitive
                return ((item.title.indexOf(filters.term) !== -1) || (item.description.indexOf(filters.term) !== -1))

                // Not case sensitive
                // return ((item.title.toLowerCase().indexOf(filters.term.toLowerCase()) !== -1) || (item.description.toLowerCase().indexOf(filters.term.toLowerCase()) !== -1))
            })
            return filteredByTerm
        }
        const buildResultItem = (dataItem) => {
            const createDateString = (dateValue) => {
                const itemDate = new Date(dateValue)
                const day = (itemDate.getDate() < 10) ? "0" + (itemDate.getDate()).toString() : (itemDate.getDate()).toString()
                const month = (itemDate.getMonth() + 1 < 10) ? "0" + (itemDate.getMonth() + 1).toString() : (itemDate.getMonth() + 1).toString()
                const year = itemDate.getFullYear().toString()
                const hours = itemDate.getHours()
                const minutes = itemDate.getMinutes()
                const dateString = `${day}.${month}.${year}`
                const timeString = `${hours}.${minutes}`
                return {
                    itemDate: dateString,
                    itemTime: timeString
                }
            }
            let dataItemDate = createDateString(dataItem.date).itemDate
            let dataItemTime = createDateString(dataItem.date).itemTime
            const itemWrap = createCustomElement({
                element: 'article',
                classListArray: ['l-results__item'],
            });
            const asideWrap = createCustomElement({
                element: 'div',
                classListArray: ['l-results__item-aside'],
            });
            const asideDate = createCustomElement({
                element: 'p',
                classListArray: ['l-results__report-date'],
                text: dataItemDate
            });
            const asideTime = createCustomElement({
                element: 'p',
                classListArray: ['l-results__report-time'],
                text: dataItemTime
            });
            const asideCategory = createCustomElement({
                element: 'p',
                classListArray: ['l-results__report-category'],
                text: 'Raporty ' + dataItem.category.toLowerCase()
            });
            const asideChildrens = [asideDate, asideTime, asideCategory]
            // appendChildrens(asideWrap, asideChildrens)
            const mainWrap = createCustomElement({
                element: 'div',
                classListArray: ['l-results__item-main'],
            });
            const mainTitle = createCustomElement({
                element: 'h3',
                classListArray: ['l-results__item-title'],
                text: dataItem.title
            });
            const mainDesc = createCustomElement({
                element: 'p',
                classListArray: ['l-results__item-desc'],
                text: dataItem.description
            });
            const mainLinksWrap = createCustomElement({
                element: 'div',
                classListArray: ['l-results__item-links'],
            });
            const mainSeeReport = createCustomElement({
                element: 'a',
                classListArray: ['l-results__report-link'],
                attributesArray: [{
                    name: 'href',
                    value: '#'
                }],
                text: 'Zobacz Raport'
            });
            mainSeeReport.setAttribute('href', '#')
            mainLinksWrap.append(mainSeeReport)
            if (dataItem.files.length === 1) {
                const mainDownloadReport = createCustomElement({
                    element: 'a',
                    classListArray: ['l-results__report-link'],
                    attributesArray: [{
                            name: 'href',
                            value: '#'
                        },
                        {
                            name: 'download',
                            value: dataItem.files[0].filename
                        }
                    ],
                    text: `Pobierz raport (${dataItem.files[0].filesize}kB)`
                });
                mainLinksWrap.append(mainDownloadReport)
            } else if (dataItem.files.length > 1) {
                const mainDownloadAccordion = setAccordion(dataItem.files)
                mainLinksWrap.append(mainDownloadAccordion)
            }
            const mainChildrens = [mainTitle, mainDesc, mainLinksWrap]

            itemWrap.append(appendChildrens(asideWrap, asideChildrens))
            itemWrap.append(appendChildrens(mainWrap, mainChildrens))
            return itemWrap
        }
        const renderResults = () => {
            resultsWrap.textContent = '';
            const resultsToRender = filterResults()
            resultsToRender.forEach(element => {
                // buildResultItem(element)
                resultsWrap.append(buildResultItem(element))
            })
        }

        const init = async () => {
            await fetchData();
            initFilters();
            checkActiveTags('Wszystkie')
        }
        init()
    }
    reportsMain()
});