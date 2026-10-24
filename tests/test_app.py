import os
import pytest
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait


@pytest.fixture
def browser():
    options = webdriver.ChromeOptions()

    # Keep the browser visible so we can observe the test.
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1366, 900)

    yield driver

    driver.quit()


def test_contacthub_opens(browser):
    browser.get(os.getenv("APP_URL", "http://localhost:8080"))

    # Wait for the browser to finish loading the page.
    WebDriverWait(browser, 15).until(
        lambda driver: driver.execute_script(
            "return document.readyState"
        ) == "complete"
    )

    # Verify that the page contains contact-related content.
    page_text = browser.find_element("tag name", "body").text.lower()

    assert "contact" in page_text, (
        "The page loaded, but no contact-related content was found."
    )