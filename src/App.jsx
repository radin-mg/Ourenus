import { Grid, ThemeProvider, CssBaseline, useMediaQuery } from "@mui/material";
import LogoBox from "./components/LogoBox";
import UserBox from "./components/UserBox";
import UsageBox from "./components/UsageBox";
import Apps from "./components/Apps";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import getTheme from "./theme/Theme";
import Configs from "./components/Configs";
import LanguageIcon from "@mui/icons-material/Language";
import GetInfoRequest from "./utils/GetInfoRequest";
import { ClipLoader } from "react-spinners";
import {
  calculateRemainingTime,
  calculateUsedTimePercentage,
  formatTraffic,
} from "./utils/Helper";
import { ToastContainer } from "react-toastify";
import RadioButtons from "./components/RadioButtons";
import { Helmet } from "react-helmet";

function App() {
  // این متغیر حالت تاریک/روشن (Dark/Light) را نگه می‌دارد
  // مقدار پیش‌فرض آن را false می‌گذاریم تا اگر مرورگر قدیمی بود، اروری ندهد
  const [isDarkMode, setIsDarkMode] = useState(false);

  // این هوک بررسی می‌کند که سیستم کاربر روی حالت تاریک تنظیم شده است یا خیر
  // (برای این‌که از MUI و متد useMediaQuery استفاده کنیم)
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  // از useEffect استفاده می‌کنیم تا فقط **یک بار** در بدو ورود، isDarkMode را
  // بر اساس حالت سیستم مقداردهی کنیم.
  useEffect(() => {
    setIsDarkMode(systemPrefersDark);
  }, [systemPrefersDark]);

  // بقیه حالت‌ها و متغیرها
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [dataLinks, setDataLinks] = useState([]);

  // تم نهایی را بر اساس مقدار isDarkMode می‌سازیم
  const theme = useMemo(() => getTheme(isDarkMode), [isDarkMode]);

  // وقتی زبان کاربر عوض می‌شود
  const handleLanguageChange = (newLanguage) => {
    i18n.changeLanguage(newLanguage);
  };

  // درخواست ابتدایی برای گرفتن اطلاعات کاربر
  useEffect(() => {
    GetInfoRequest.getInfo()
      .then((res) => {
        setData(res?.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // اگر لینک‌هایی در سرور وجود داشته باشد، اینجا آن‌ها را می‌گیریم
  useEffect(() => {
    if (data?.links) {
      const links =
        data.links[data.links.length - 1] === "False"
          ? data.links.slice(0, -1)
          : data.links;
      setDataLinks(links);
    } else if (data && !data.links) {
      GetInfoRequest.getConfigs().then((res) => {
        const links = res.data.trim();
        const decodedLinks =
          links.includes("vmess") || links.includes("vless")
            ? links
            : decodeBase64(links);
        const configArray = decodedLinks ? decodedLinks.split("\n") : [];
        setDataLinks(
          configArray[configArray.length - 1] === "False"
            ? configArray.slice(0, -1)
            : configArray
        );
      });
    }
  }, [data]);

  // اگر آدرس سابکاربر اشتباه بود یا نیاز به تنظیم داشت
  const getAdjustedUrl = (subURL) => {
    if (import.meta.env.VITE_PANEL_DOMAIN) {
      return subURL.replace(/https?:\/\/[^/]+/, import.meta.env.VITE_PANEL_DOMAIN);
    } else if (subURL?.includes("https://")) {
      return subURL;
    }
    return `${window.location.origin}${subURL}`;
  };

  // عنوان تب مرورگر را می‌سازیم
  const title = data?.username
    ? `${data.username} Sub Info`
    : `${import.meta.env.VITE_BRAND_NAME || "Ourenus"} Sub Info`;

  // این آبجکت برای خاموش/روشن کردن بخش‌های مختلف استفاده می‌شود
  const isOffSections = useMemo(() => {
    try {
      const envValue = import.meta.env.VITE_OFF_SECTIONS;
      if (envValue) {
        return JSON.parse(envValue);
      }
      return {
        appsBox: true,
        logoBox: true,
        timeBox: true,
        usageBox: true,
        userBox: true,
        supportBox: true,
        configs: true,
      };
    } catch (error) {
      console.error("Failed to parse VITE_OFF_SECTIONS:", error);
      return {
        appsBox: true,
        logoBox: true,
        timeBox: true,
        usageBox: true,
        userBox: true,
        supportBox: true,
        configs: true,
      };
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {/* ریست و استایل پایهٔ MUI */}
      <CssBaseline />
      {/* تنظیم title صفحه و meta-description */}
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content="Powered by https://github.com/MatinDehghanian"
        />
      </Helmet>

      <Grid container justifyContent={"center"}>
        <Grid
          container
          justifyContent={"center"}
          item
          xs={11.5}
          sm={7}
          md={6}
          lg={5}
          xl={3.5}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
              }}
            >
              <ClipLoader size={50} color="#3498db" loading={loading} />
            </div>
          ) : (
            data && (
              <>
                {/* این کامپوننت رادیوباتن، در کد اصلی شما هست.
                    می‌تواند زبان و همچنین isDarkMode را کنترل کند */}
                <RadioButtons
                  setIsDarkMode={setIsDarkMode}
                  handleLanguageChange={handleLanguageChange}
                />

                {isOffSections.logoBox && <LogoBox />}

                {isOffSections.userBox && (
                  <UserBox
                    data={data}
                    subLink={getAdjustedUrl(data?.subscription_url)}
                  />
                )}

                {isOffSections.usageBox && (
                  <UsageBox
                    type="usage"
                    value={Number(
                      ((data?.used_traffic / data?.data_limit) * 100).toFixed(2)
                    )}
                    total={formatTraffic(data?.data_limit, t)}
                    remaining={
                      data?.data_limit === null
                        ? formatTraffic(null, t)
                        : formatTraffic(data?.data_limit - data?.used_traffic, t)
                    }
                  />
                )}

                {isOffSections.timeBox && (
                  <UsageBox
                    type="time"
                    value={calculateUsedTimePercentage(
                      data?.expire || data?.expire_date
                    )}
                    remaining={calculateRemainingTime(
                      data?.expire || data?.expire_date,
                      t
                    )}
                  />
                )}

                {isOffSections.appsBox && (
                  <Apps subLink={getAdjustedUrl(data?.subscription_url)} />
                )}

                {isOffSections.configs && (
                  <Configs
                    title={t("configsList")}
                    style={{
                      direction: lang === "fa" ? "rtl" : "ltr",
                      background: theme.colors.configs[theme.palette.mode],
                      boxShadow: "0 0 30px 10px rgba(0, 0, 0, 0.1)",
                      width: "100%",
                      border:
                        theme.palette.mode === "light"
                          ? "1px solid #ffffff6b"
                          : "none",
                      borderRadius: "16px",
                      paddingY: ".4rem",
                      color:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255)"
                          : "rgb(0 0 0)",
                    }}
                    iconColor={theme.colors.configs.revert[theme.palette.mode]}
                    icon={
                      <LanguageIcon
                        fontSize="large"
                        sx={{
                          marginInlineStart: "1rem",
                          color: theme.colors.configs.revert[theme.palette.mode],
                        }}
                      />
                    }
                    configs={dataLinks}
                    btnStyle={{
                      cursor: "pointer",
                      borderRadius: "30%",
                      padding: ".3rem",
                      background: theme.colors.glassColor,
                      "&:hover": {
                        background: theme.colors.configs.revert[theme.palette.mode],
                      },
                    }}
                    liStyle={{
                      background: theme.colors.glassColor,
                    }}
                    isFirst={!isOffSections.appsBox}
                  />
                )}
              </>
            )
          )}
        </Grid>

        <ToastContainer
          position="top-right"
          theme="colored"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ marginTop: "1rem", borderRadius: "16px" }}
        />
      </Grid>
    </ThemeProvider>
  );
}

export default App;

function decodeBase64(encodedString) {
  try {
    return atob(encodedString);
  } catch (error) {
    console.error("Failed to decode base64:", error);
    return "";
  }
}
